from fastapi import APIRouter, HTTPException
from starlette.requests import Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.cleanup import cleanup_old_batches, cleanup_temp_uploads, log_cleanup_stats
import logging
import os
import json

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(tags=["Export"])


@router.get("/check-logo/batch/getCount")
async def get_last_batch_count(request: Request, batch_id: str):
    batch_dir = os.path.join("data", batch_id)
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
        batch_dir = os.path.join("data", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        csv_path = metadata["csv_path"]

        return FileResponse(
            csv_path,
            media_type="text/csv",
            filename=f"logo_detection_results_{batch_id}.csv",
        )

    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/maintenance/cleanup")
@limiter.limit("2/minute")
async def trigger_cleanup(
    request: Request, batch_age_hours: int = 24, temp_age_minutes: int = 30
):
    """
    Manually trigger cleanup of old batch results and temporary files.
    Returns the number of items cleaned up.
    """
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
