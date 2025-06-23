"""
Batch History Router

This module provides endpoints for retrieving batch processing history.
It handles administrative access to batch processing results, metadata and previews.
The module requires authentication and provides error handling for all operations.

Endpoints:
- GET /api/admin/batch-history: Get history of all processed batches
- GET /api/admin/batch/{batch_id}: Get detailed information about a specific batch
- GET /api/admin/batch/{batch_id}/preview: Get preview of first 5 entries in batch results
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import List, Dict, Optional, Any
import os
import json
import glob
from datetime import datetime
import logging
import sys
import csv

from routers.batch import check_token_valid

# Setup logging for batch history operations
logger = logging.getLogger(__name__)

# Create router with batch_history tag for API documentation
router = APIRouter(tags=["batch_history"])


def admin_required(token: Optional[str] = Header(None, alias="X-Auth-Token")):
    """
    Dependency to ensure the user is authenticated as admin.
    Validates the authentication token provided in request header.

    Args:
        token (Optional[str]): Authentication token from X-Auth-Token header

    Returns:
        bool: True if authentication is successful

    Raises:
        HTTPException: 401 error if token is invalid or missing
    """
    if not token or not check_token_valid(token):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return True


@router.get("/api/admin/batch-history")
def get_batch_history(_: bool = Depends(admin_required)) -> List[Dict[str, Any]]:
    """
    Get history of all processed batches.
    Retrieves information about all batch processing jobs from the exports directory.

    Returns:
        List[Dict[str, Any]]: List of batch history records containing:
            - batch_id: Unique identifier for the batch
            - filename: Name of results file
            - created_at: Timestamp when batch was created
            - file_size: Size of results file in bytes
            - download_url: URL to download results
            - valid_count: Number of valid records
            - invalid_count: Number of invalid records
            - total_count: Total number of records

    Raises:
        HTTPException: 500 error if batch history cannot be retrieved
    """
    try:
        history = []

        # Get all batch directories in the exports directory
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dirs = [
            d for d in glob.glob(os.path.join(export_dir, "*")) if os.path.isdir(d)
        ]

        for batch_dir in batch_dirs:
            batch_id = os.path.basename(batch_dir)
            results_file = os.path.join(batch_dir, "results.csv")
            metadata_file = os.path.join(batch_dir, "metadata.json")

            # Skip if results file doesn't exist
            if not os.path.exists(results_file):
                continue

            # Get file creation time and size
            stats = os.stat(results_file)
            created_time = datetime.fromtimestamp(stats.st_ctime).isoformat()
            file_size = stats.st_size

            # Initialize counters for batch statistics
            valid_count = 0
            invalid_count = 0
            total_count = 0

            # Extract counts from metadata if available
            if os.path.exists(metadata_file):
                try:
                    with open(metadata_file, "r") as f:
                        metadata = json.load(f)
                        if "counts" in metadata:
                            valid_count = metadata["counts"].get("valid", 0)
                            invalid_count = metadata["counts"].get("invalid", 0)
                            total_count = metadata["counts"].get("total", 0)
                except Exception as e:
                    logger.error(f"Error reading metadata file: {str(e)}")

            # Build history record for this batch
            history.append(
                {
                    "batch_id": batch_id,
                    "filename": f"{batch_id}/results.csv",
                    "created_at": created_time,
                    "file_size": file_size,
                    "download_url": f"/api/exports/{batch_id}/results.csv",
                    "valid_count": valid_count,
                    "invalid_count": invalid_count,
                    "total_count": total_count,
                }
            )

        # Sort batches by creation time, newest first
        history.sort(key=lambda x: x["created_at"], reverse=True)

        return history

    except Exception as e:
        logger.error(f"Error retrieving batch history: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error retrieving batch history: {str(e)}"
        )


@router.get("/api/admin/batch/{batch_id}")
def get_batch_details(
    batch_id: str, _: bool = Depends(admin_required)
) -> Dict[str, Any]:
    """
    Get detailed information about a specific batch.
    Retrieves comprehensive metadata and statistics for a single batch.

    Args:
        batch_id (str): The ID of the batch to retrieve
        _ (bool): Admin authentication dependency

    Returns:
        Dict[str, Any]: Batch details including:
            - All fields from batch history
            - Complete metadata object
            - Processing statistics

    Raises:
        HTTPException: 404 if batch not found, 500 for other errors
    """
    try:
        # Construct paths for batch files
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dir = os.path.join(export_dir, batch_id)
        results_file = os.path.join(batch_dir, "results.csv")
        metadata_file = os.path.join(batch_dir, "metadata.json")

        # Verify batch exists
        if not os.path.exists(batch_dir) or not os.path.exists(results_file):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        # Get file statistics
        stats = os.stat(results_file)
        created_time = datetime.fromtimestamp(stats.st_ctime).isoformat()
        file_size = stats.st_size

        # Load additional metadata if available
        metadata = {}
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)
            except Exception as e:
                logger.error(f"Error reading metadata file: {str(e)}")

        # Extract processing statistics
        valid_count = 0
        invalid_count = 0
        total_count = 0

        if "counts" in metadata:
            valid_count = metadata["counts"].get("valid", 0)
            invalid_count = metadata["counts"].get("invalid", 0)
            total_count = metadata["counts"].get("total", 0)

        # Construct response with all batch details
        return {
            "batch_id": batch_id,
            "filename": f"{batch_id}/results.csv",
            "created_at": created_time,
            "file_size": file_size,
            "download_url": f"/api/exports/{batch_id}/results.csv",
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "total_count": total_count,
            "metadata": metadata,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving batch details: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error retrieving batch details: {str(e)}"
        )


@router.get("/api/admin/batch/{batch_id}/preview")
def get_batch_preview(
    batch_id: str, _: bool = Depends(admin_required)
) -> Dict[str, Any]:
    """
    Get a preview of the first 5 entries in the batch results.
    Provides a sample of the batch processing results for quick review.

    Args:
        batch_id (str): The ID of the batch to preview
        _ (bool): Admin authentication dependency

    Returns:
        Dict[str, Any]: Preview data containing:
            - batch_id: ID of the batch
            - preview: List of up to 5 processed records

    Raises:
        HTTPException: 404 if batch not found, 500 for other errors
    """
    try:
        # Construct file paths
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dir = os.path.join(export_dir, batch_id)
        results_file = os.path.join(batch_dir, "results.csv")

        # Verify batch exists
        if not os.path.exists(batch_dir) or not os.path.exists(results_file):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        # Read preview data from CSV
        preview_data = []
        try:
            with open(results_file, "r") as f:
                csv_reader = csv.DictReader(f)
                for i, row in enumerate(csv_reader):
                    if i >= 5:  # Limit to first 5 rows
                        break

                    # Parse JSON fields if present
                    if (
                        "Bounding_Box" in row
                        and row["Bounding_Box"]
                        and row["Bounding_Box"].lower() != "none"
                    ):
                        try:
                            if row["Bounding_Box"].startswith("{"):
                                row["Bounding_Box"] = json.loads(row["Bounding_Box"])
                        except:
                            pass  # Keep as string if parsing fails

                    preview_data.append(row)
        except Exception as e:
            logger.error(f"Error reading CSV file: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Error reading CSV file: {str(e)}"
            )

        return {"batch_id": batch_id, "preview": preview_data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving batch preview: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error retrieving batch preview: {str(e)}"
        )
