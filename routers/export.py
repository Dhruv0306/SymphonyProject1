from fastapi import APIRouter, HTTPException, Header, Query
from starlette.requests import Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from routers.batch import check_token_valid
from utils.cleanup import (
    cleanup_old_batches,
    cleanup_old_pending_batches,
    cleanup_temp_uploads,
    log_cleanup_stats,
)
from typing import Optional
import sys
import logging

import os
import json

# Initialize logger for this module
logger = logging.getLogger(__name__)

# Initialize rate limiter using client IP address
limiter = Limiter(key_func=get_remote_address)

# Create router for export-related endpoints
router = APIRouter(tags=["Export"])


@router.get("/check-logo/batch/getCount")
async def get_last_batch_count(request: Request, batch_id: str):
    """
    Get the count of processed items for a specific batch.

    Args:
        request (Request): The incoming HTTP request
        batch_id (str): The ID of the batch to get counts for

    Returns:
        dict: A dictionary containing the count information from the batch metadata

    Raises:
        HTTPException: If the batch_id is invalid or metadata file doesn't exist
    """
    # Construct paths to batch directory and metadata file
    batch_dir = os.path.join("exports", batch_id)
    metadata_path = os.path.join(batch_dir, "metadata.json")

    # Validate that metadata exists for this batch
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

    # Read and return the counts from metadata
    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    return metadata["counts"]


@router.get("/api/check-logo/batch/export-csv")
@limiter.limit("10/minute")
async def export_batch_results_csv(request: Request, batch_id: str):
    """
    Export the batch processing results to a CSV file.

    Args:
        request (Request): The incoming HTTP request
        batch_id (str): The ID of the batch to export

    Returns:
        FileResponse: A downloadable CSV file containing the batch results

    Raises:
        HTTPException: If the batch_id is invalid or files don't exist
    """
    try:
        # Construct paths to required files
        batch_dir = os.path.join("exports", batch_id)
        results_path = os.path.join(batch_dir, "results.csv")
        metadata_path = os.path.join(batch_dir, "metadata.json")

        # Validate that both metadata and results exist
        if not os.path.exists(metadata_path) or not os.path.exists(results_path):
            raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

        # Generate clean filename for download
        filename = f"logo_detection_results_{batch_id}.csv"
        filename = filename.strip()

        # Return CSV file as download response
        return FileResponse(
            results_path,
            media_type="text/csv",
            filename=filename,
        )

    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/exports/{batch_id}/{filename}")
async def get_export_file(
    batch_id: str, filename: str, token: Optional[str] = Query(None)
):
    """
    Get an exported file by batch ID and filename.

    Args:
        batch_id (str): The ID of the batch containing the file
        filename (str): Name of the file to download
        token (Optional[str]): Authentication token provided as query parameter

    Returns:
        FileResponse: The requested file as a download

    Raises:
        HTTPException: If authentication fails or file doesn't exist
    """
    try:
        # Verify authentication token
        if not token or not check_token_valid(token):
            raise HTTPException(status_code=401, detail="Authentication required")

        # Construct and validate file path
        file_path = os.path.join("exports", batch_id, filename)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, detail=f"File not found: {batch_id}/{filename}"
            )

        # Generate download filename including batch ID
        download_filename = f"Batch_{batch_id}_{filename}"

        # Return file as download response
        return FileResponse(
            file_path, media_type="text/csv", filename=download_filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving export file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/maintenance/cleanup")
@limiter.limit("2/minute")
async def trigger_cleanup(
    request: Request,
    batch_age_hours: int = 24,
    temp_age_minutes: int = 30,
    pending_age_hours: int = 72,
    token: Optional[str] = Header(None, alias="X-Auth-Token"),
):
    """
    Manually trigger cleanup of old batch results and temporary files.

    Args:
        request (Request): The incoming HTTP request
        batch_age_hours (int): Maximum age in hours for batch files before cleanup
        temp_age_minutes (int): Maximum age in minutes for temp files before cleanup
        pending_age_hours (int): Maximum age in hours for pending batches before cleanup (default: 72 = 3 days)
        token (Optional[str]): Authentication token provided in header

    Returns:
        dict: Statistics about the cleanup operation

    Raises:
        HTTPException: If authentication fails or cleanup encounters an error
    """
    # Verify admin authentication token
    if not token or not check_token_valid(token):
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Execute cleanup operations
        batch_cleaned = cleanup_old_batches(max_age_hours=batch_age_hours)
        temp_cleaned = cleanup_temp_uploads(max_age_minutes=temp_age_minutes)
        pending_cleaned = cleanup_old_pending_batches(max_age_hours=pending_age_hours)

        # Log cleanup statistics
        log_cleanup_stats(batch_cleaned, temp_cleaned, pending_cleaned)

        # Return cleanup results
        return {
            "status": "success",
            "batches_cleaned": batch_cleaned,
            "temp_files_cleaned": temp_cleaned,
            "pending_batches_cleaned": pending_cleaned,
            "batch_age_hours": batch_age_hours,
            "temp_age_minutes": temp_age_minutes,
            "pending_age_hours": pending_age_hours,
        }
    except Exception as e:
        logger.error(f"Error during manual cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
