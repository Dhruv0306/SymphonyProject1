from fastapi import APIRouter, HTTPException, Header, Query
from starlette.requests import Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from routers.batch import check_token_valid
from utils.cleanup import cleanup_old_batches, cleanup_temp_uploads, log_cleanup_stats
from typing import Optional
import sys
import logging

import os
import json

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(tags=["Export"])


@router.get("/check-logo/batch/getCount")
async def get_last_batch_count(request: Request, batch_id: str):
    batch_dir = os.path.join("exports", batch_id)
    metadata_path = os.path.join(batch_dir, "metadata.json")
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    return metadata["counts"]


@router.get("/api/check-logo/batch/export-csv")
@limiter.limit("10/minute")
async def export_batch_results_csv(request: Request, batch_id: str):
    """
    Export the most recent batch processing results to a CSV file.
    Returns a downloadable CSV file with the results.
    """
    try:
        batch_dir = os.path.join("exports", batch_id)
        results_path = os.path.join(batch_dir, "results.csv")
        metadata_path = os.path.join(batch_dir, "metadata.json")
        
        if not os.path.exists(metadata_path) or not os.path.exists(results_path):
            raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

        filename = f"logo_detection_results_{batch_id}.csv"
        # Ensure filename has no extra spaces
        filename = filename.strip()
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
    batch_id: str,
    filename: str, 
    token: Optional[str] = Query(None)
):
    """
    Get an exported file by batch_id and filename.
    Requires authentication token as a query parameter.
    """
    try:
        # Validate token
        if not token or not check_token_valid(token):
            raise HTTPException(status_code=401, detail="Authentication required")
        
        file_path = os.path.join("exports", batch_id, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {batch_id}/{filename}")
        
        # Use batch_id in the filename for download
        download_filename = f"Batch_{batch_id}_{filename}"
        
        return FileResponse(
            file_path,
            media_type="text/csv",
            filename=download_filename
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
    token: Optional[str] = Header(None, alias="X-Auth-Token")
):
    """
    Manually trigger cleanup of old batch results and temporary files.
    Returns the number of items cleaned up.
    """
    # Validate token for admin operations
    if not token or not check_token_valid(token):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        batch_cleaned = cleanup_old_batches(max_age_hours=batch_age_hours)
        temp_cleaned = cleanup_temp_uploads(max_age_minutes=temp_age_minutes)
        log_cleanup_stats(batch_cleaned, temp_cleaned)

        return {
            "status": "success",
            "batches_cleaned": batch_cleaned,
            "temp_files_cleaned": temp_cleaned,
            "batch_age_hours": batch_age_hours,
            "temp_age_minutes": temp_age_minutes,
        }
    except Exception as e:
        logger.error(f"Error during manual cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))