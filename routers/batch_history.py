"""
Batch History Router

This module provides endpoints for retrieving batch processing history.
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

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["batch_history"])


def admin_required(token: Optional[str] = Header(None, alias="X-Auth-Token")):
    """
    Dependency to ensure the user is authenticated as admin

    Args:
        token: Authentication token from header

    Returns:
        bool: True if authenticated

    Raises:
        HTTPException: If not authenticated
    """
    if not token or not check_token_valid(token):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return True


@router.get("/api/admin/batch-history")
def get_batch_history(_: bool = Depends(admin_required)) -> List[Dict[str, Any]]:
    """
    Get history of all processed batches

    Returns:
        List[Dict]: List of batch history records
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

            if not os.path.exists(results_file):
                continue

            # Get file stats
            stats = os.stat(results_file)
            created_time = datetime.fromtimestamp(stats.st_ctime).isoformat()
            file_size = stats.st_size

            # Try to get valid/invalid counts from metadata file
            valid_count = 0
            invalid_count = 0
            total_count = 0

            if os.path.exists(metadata_file):
                try:
                    with open(metadata_file, "r") as f:
                        metadata = json.load(f)
                        # Get counts from the correct metadata structure
                        if "counts" in metadata:
                            valid_count = metadata["counts"].get("valid", 0)
                            invalid_count = metadata["counts"].get("invalid", 0)
                            total_count = metadata["counts"].get("total", 0)
                except Exception as e:
                    logger.error(f"Error reading metadata file: {str(e)}")

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

        # Sort by creation time (newest first)
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
    Get detailed information about a specific batch

    Args:
        batch_id: The ID of the batch to retrieve

    Returns:
        Dict: Batch details

    Raises:
        HTTPException: If batch not found
    """
    try:
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dir = os.path.join(export_dir, batch_id)
        results_file = os.path.join(batch_dir, "results.csv")
        metadata_file = os.path.join(batch_dir, "metadata.json")

        if not os.path.exists(batch_dir) or not os.path.exists(results_file):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        # Get file stats
        stats = os.stat(results_file)
        created_time = datetime.fromtimestamp(stats.st_ctime).isoformat()
        file_size = stats.st_size

        # Try to get additional metadata
        metadata = {}

        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)
            except Exception as e:
                logger.error(f"Error reading metadata file: {str(e)}")

        # Extract valid/invalid counts from metadata for frontend display
        valid_count = 0
        invalid_count = 0
        total_count = 0

        if "counts" in metadata:
            valid_count = metadata["counts"].get("valid", 0)
            invalid_count = metadata["counts"].get("invalid", 0)
            total_count = metadata["counts"].get("total", 0)

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
    Get a preview of the first 5 entries in the batch results

    Args:
        batch_id: The ID of the batch to retrieve

    Returns:
        Dict: Preview data with up to 5 entries

    Raises:
        HTTPException: If batch not found
    """
    try:
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dir = os.path.join(export_dir, batch_id)
        results_file = os.path.join(batch_dir, "results.csv")

        if not os.path.exists(batch_dir) or not os.path.exists(results_file):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        # Read the first 5 entries from the CSV file
        preview_data = []
        try:
            with open(results_file, "r") as f:
                csv_reader = csv.DictReader(f)
                for i, row in enumerate(csv_reader):
                    if i >= 5:  # Only get the first 5 rows
                        break

                    # Convert string representations of objects to actual objects
                    if (
                        "Bounding_Box" in row
                        and row["Bounding_Box"]
                        and row["Bounding_Box"].lower() != "none"
                    ):
                        try:
                            # Handle potential JSON string
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
