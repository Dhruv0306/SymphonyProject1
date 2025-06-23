"""
Dashboard Statistics Router

This module provides endpoints for retrieving dashboard statistics for the admin interface.
It calculates metrics like success rate, processing time and error rate from batch metadata.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging
import os
import glob
import json
from datetime import datetime, timedelta

# Setup logging for error tracking and debugging
logger = logging.getLogger(__name__)

# Create FastAPI router with admin tag for API documentation
router = APIRouter(tags=["admin"])

# Import valid session tokens from admin auth module for authentication
from routers.admin_auth import valid_tokens


@router.get("/api/admin/dashboard-stats")
async def get_dashboard_stats(
    token: Optional[str] = Header(None, alias="X-Auth-Token")
) -> dict:
    """
    Get dashboard statistics for the admin interface.

    Calculates key metrics from batch processing metadata including:
    - Number of batches processed today
    - Success rate of image processing
    - Average processing time per batch
    - Error rate of image processing

    Args:
        token (str, optional): Authentication token passed in X-Auth-Token header.
            Used to verify admin access.

    Returns:
        dict: Dashboard statistics containing:
            - batches_today (int): Number of batches processed today
            - success_rate (float): Percentage of successfully processed images
            - avg_processing_time (float): Average processing time in seconds
            - error_rate (float): Percentage of failed image processing

    Raises:
        HTTPException:
            - 401 if authentication token is invalid or missing
            - 500 if there is an error retrieving or calculating statistics
    """
    # Validate admin authentication token
    if not token or token not in valid_tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get all batch directories from the exports folder
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dirs = [
            d for d in glob.glob(os.path.join(export_dir, "*")) if os.path.isdir(d)
        ]

        # Get today's date for filtering today's batches
        today = datetime.now().date()

        # Initialize counters for statistics calculation
        batches_today = 0
        total_valid = 0
        total_invalid = 0
        total_processing_time = 0
        batches_with_time = 0

        # Process each batch directory to collect statistics
        for batch_dir in batch_dirs:
            metadata_file = os.path.join(batch_dir, "metadata.json")

            # Skip if metadata file doesn't exist
            if not os.path.exists(metadata_file):
                continue

            try:
                # Read batch metadata
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)

                # Get creation date from file metadata
                stats = os.stat(metadata_file)
                created_date = datetime.fromtimestamp(stats.st_ctime).date()

                # Increment today's batch counter if processed today
                if created_date == today:
                    batches_today += 1

                # Accumulate success/failure counts
                if "counts" in metadata:
                    total_valid += metadata["counts"].get("valid", 0)
                    total_invalid += metadata["counts"].get("invalid", 0)

                # Calculate total processing time if timestamps available
                if "completed_at" in metadata and "created_at" in metadata:
                    processing_time = metadata["completed_at"] - metadata["created_at"]
                    total_processing_time += processing_time
                    batches_with_time += 1

            except Exception as e:
                logger.error(f"Error reading metadata file {metadata_file}: {str(e)}")

        # Calculate success rate as percentage of valid images
        total_images = total_valid + total_invalid
        success_rate = (total_valid / total_images * 100) if total_images > 0 else 0
        success_rate = round(success_rate, 1)

        # Calculate average processing time per batch in seconds
        avg_processing_time = (
            (total_processing_time / batches_with_time) if batches_with_time > 0 else 0
        )
        avg_processing_time = round(avg_processing_time, 1)

        # Calculate error rate as inverse of success rate
        error_rate = round(100 - success_rate, 1)

        # Return calculated statistics
        return {
            "batches_today": batches_today,
            "success_rate": success_rate,
            "avg_processing_time": avg_processing_time,
            "error_rate": error_rate,
        }

    except Exception as e:
        # Log error and return 500 response
        logger.error(f"Error retrieving dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Error retrieving dashboard statistics"
        )
