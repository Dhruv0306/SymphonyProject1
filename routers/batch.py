from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
    Header,
)
from starlette.requests import Request
from typing import List, Optional
from models.logo_check import (
    LogoCheckResult,
    BatchUrlRequest,
    BatchProcessingResponse,
    BatchStartResponse,
    BatchStatusResponse,
)
from pydantic import BaseModel


class InitBatchRequest(BaseModel):
    """
    Request model for initializing a batch.
    """

    batch_id: str
    client_id: str
    total: int


from services.yolo_client import yolo_client
from utils.file_ops import UPLOAD_DIR
from utils.ws_manager import ConnectionManager
from utils.emailer import send_batch_summary_email
from utils.batch_tracker import (
    init_batch,
    update_batch,
    mark_done,
    clear_batch,
    get_progress,
)
from utils.websocket import broadcast_json
from utils.background_tasks import process_with_chunks
from utils.batch_tracker import init_batch
import sys
import asyncio


# Function to check token validity without circular imports
def check_token_valid(token: str) -> bool:
    """
    Check if a token is valid by accessing the admin_auth module's valid_tokens set.

    Args:
        token (str): The authentication token to validate.

    Returns:
        bool: True if token is valid, False otherwise.
    """
    # Get the admin_auth module from sys.modules to avoid circular imports
    if "routers.admin_auth" in sys.modules:
        admin_auth = sys.modules["routers.admin_auth"]
        if hasattr(admin_auth, "valid_tokens"):
            return token in admin_auth.valid_tokens
    return False


# Import the connection manager instance
from utils.ws_manager import connection_manager
from slowapi import Limiter
from slowapi.util import get_remote_address
from tqdm import tqdm
import os
import shutil
import uuid
import tempfile
import csv
import logging
import json
import time
from fastapi.responses import JSONResponse
import zipfile
from io import BytesIO

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

# Define the FastAPI router for batch processing endpoints
router = APIRouter(
    prefix="/api",
    tags=["Batch Processing"],
    responses={
        429: {
            "description": "Too Many Requests - Rate limit exceeded",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Rate limit exceeded. Try again in 60 seconds."
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {"detail": "An unexpected error occurred"}
                }
            },
        },
    },
)


@router.post(
    "/init-batch",
    summary="Initialize batch tracking",
    response_description="Batch tracking initialized",
)
async def init_batch_endpoint(payload: InitBatchRequest):
    """
    Initialize batch tracking with total count before uploading chunks.

    Args:
        payload (InitBatchRequest): Batch initialization data.

    Returns:
        dict: Confirmation message with batch_id and total.
    """
    try:
        # Initialize batch in tracker
        init_batch(payload.batch_id, payload.total)

        # Update metadata.json with the correct total count
        batch_dir = os.path.join("exports", payload.batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                metadata = json.load(f)

            metadata["counts"]["total"] = payload.total
            metadata["status"] = "processing"

            with open(metadata_path, "w") as f:
                json.dump(metadata, f)

        return {
            "message": "Batch initialized",
            "batch_id": payload.batch_id,
            "total": payload.total,
        }
    except Exception as e:
        logger.error(f"Error initializing batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/start-batch",
    response_model=BatchStartResponse,
    summary="Start a new batch processing session",
    response_description="Returns a unique batch ID for tracking",
    status_code=201,
    responses={
        201: {
            "description": "Successfully created batch session",
            "content": {
                "application/json": {
                    "example": {
                        "batch_id": "550e8400-e29b-41d4-a716-446655440000",
                        "message": "Batch processing session started",
                    }
                }
            },
        }
    },
)
async def start_batch(
    request: Request,
    client_id: Optional[str] = Form(None),
    token: Optional[str] = Header(None, alias="X-Auth-Token"),
    email: Optional[str] = Form(
        None, description="Email address for batch completion notification"
    ),
):
    """
    Initialize a new batch processing session.

    Creates necessary directories and files for batch tracking.
    Use the returned batch_id in subsequent batch processing requests.

    Args:
        request (Request): The incoming request.
        client_id (Optional[str]): Client ID for associating the batch.
        token (Optional[str]): Optional authentication token.
        email (Optional[str]): Email for batch completion notification.

    Returns:
        BatchStartResponse: Contains the batch ID and success message.
    """
    try:
        # Check if token is required (for admin dashboard)
        if token:
            # Use a function to check token validity to avoid circular imports
            valid = check_token_valid(token)
            if not valid:
                raise HTTPException(status_code=401, detail="Authentication required")

        # Generate a unique batch ID and create batch directory
        batch_id = str(uuid.uuid4())
        batch_dir = os.path.join("exports", batch_id)
        os.makedirs(batch_dir, exist_ok=True)

        # Create CSV file for this batch
        csv_path = os.path.join(batch_dir, "results.csv")
        with open(csv_path, "w", newline="") as csv_file:
            fieldnames = [
                "Image_Path_or_URL",
                "Is_Valid",
                "Confidence",
                "Detected_By",
                "Bounding_Box",
                "Error",
            ]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

        # Store metadata in a JSON file
        metadata = {
            "csv_path": csv_path,
            "counts": {"valid": 0, "invalid": 0, "total": 0},
            "status": "initialized",
            "created_at": time.time(),
            "email": email if email else None,
        }
        with open(os.path.join(batch_dir, "metadata.json"), "w") as f:
            json.dump(metadata, f)

        # Associate batch with client if client_id provided
        if client_id:
            connection_manager.associate_batch(client_id, batch_id)

        return BatchStartResponse(
            batch_id=batch_id, message="Batch processing session started"
        )

    except Exception as e:
        logger.error(f"Error starting new batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/check-logo/batch/",
    summary="Start batch processing (returns immediately)",
    response_description="Batch started confirmation",
    responses={
        200: {
            "description": "Successfully processed batch",
            "content": {
                "application/json": {
                    "example": {
                        "batch_id": "550e8400-e29b-41d4-a716-446655440000",
                        "total_processed": 2,
                        "valid_count": 1,
                        "invalid_count": 1,
                        "results": [
                            {
                                "Image_Path_or_URL": "example1.jpg",
                                "Is_Valid": "Valid",
                                "Confidence": 0.92,
                                "Detected_By": "YOLOv8s #1",
                                "Bounding_Box": {
                                    "x1": 100,
                                    "y1": 150,
                                    "x2": 300,
                                    "y2": 350,
                                },
                            },
                            {
                                "Image_Path_or_URL": "example2.jpg",
                                "Is_Valid": "Invalid",
                                "Confidence": None,
                                "Detected_By": None,
                                "Bounding_Box": None,
                                "Error": "No logo detected",
                            },
                        ],
                    }
                }
            },
        },
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid request format or missing required fields"
                    }
                }
            },
        },
    },
)
@limiter.limit("60/minute")
async def check_logo_batch(
    request: Request,
    background_tasks: BackgroundTasks,
    files: Optional[List[UploadFile]] = File(
        None, description="List of image files to validate"
    ),
    zip_file: Optional[UploadFile] = File(
        None, description="A zip file containing images for batch processing"
    ),
    batch_id: Optional[str] = Form(
        None, description="Optional batch ID for tracking progress"
    ),
    client_id: Optional[str] = Form(
        None, description="Client ID for WebSocket updates"
    ),
    chunkSize: Optional[int] = Form(10, description="Chunk size for batch processing"),
    batch_request: Optional[BatchUrlRequest] = None,
):
    """
    Start batch processing - returns immediately with batch_id for WebSocket tracking.

    Handles file uploads, zip file uploads, and JSON URL lists for batch processing.
    Initiates background processing and returns a confirmation response.

    Args:
        request (Request): The incoming request.
        background_tasks (BackgroundTasks): FastAPI background task manager.
        files (Optional[List[UploadFile]]): List of uploaded files.
        zip_file (Optional[UploadFile]): Zip file containing images.
        batch_id (Optional[str]): Batch ID for tracking.
        client_id (Optional[str]): Client ID for WebSocket updates.
        chunkSize (Optional[int]): Chunk size for batch processing.
        batch_request (Optional[BatchUrlRequest]): Batch request for URL processing.

    Returns:
        dict: Confirmation message with batch_id and status.
    """
    try:
        content_type = request.headers.get("content-type", "")

        # Handle JSON URLs
        if "application/json" in content_type:
            if not batch_request:
                raw_body = await request.json()
                batch_request = BatchUrlRequest(**raw_body)

            if not batch_request.image_paths:
                raise HTTPException(status_code=400, detail="No image URLs provided")

            batch_id = batch_request.batch_id
            client_id = getattr(batch_request, "client_id", None)
            # Validate batch exists
            batch_dir = os.path.join("exports", batch_id)
            if not os.path.exists(os.path.join(batch_dir, "metadata.json")):
                raise HTTPException(
                    status_code=400, detail=f"Invalid batch_id: {batch_id}"
                )

            # Batch should already be initialized via /init-batch

            # Start background processing for URL list
            asyncio.create_task(
                process_with_chunks(
                    batch_id=batch_id,
                    image_urls=batch_request.image_paths,
                    client_id=client_id,
                    chunk_size=chunkSize,
                )
            )

            return {
                "batch_id": batch_id,
                "message": "Batch processing started",
                "status": "processing",
            }

        # Handle zip file upload
        elif zip_file is not None:
            if not batch_id:
                raise HTTPException(status_code=400, detail="batch_id required")

            # Validate batch exists
            batch_dir = os.path.join("exports", batch_id)
            if not os.path.exists(os.path.join(batch_dir, "metadata.json")):
                raise HTTPException(
                    status_code=400, detail=f"Invalid batch_id: {batch_id}"
                )

            # Extract images from zip file into memory

            zip_bytes = await zip_file.read()
            files_data = []
            with zipfile.ZipFile(BytesIO(zip_bytes)) as zf:
                for name in zf.namelist():
                    # Skip directories
                    if name.endswith("/") or name.endswith("\\"):
                        continue
                    with zf.open(name) as file:
                        files_data.append((name, file.read()))

            if not files_data:
                raise HTTPException(
                    status_code=400, detail="No images found in zip file"
                )

            # Start background processing for extracted images
            asyncio.create_task(
                process_with_chunks(
                    batch_id=batch_id,
                    files_data=files_data,
                    client_id=client_id,
                    chunk_size=chunkSize,
                )
            )

            return {
                "batch_id": batch_id,
                "message": "Batch processing started (zip file)",
                "status": "processing",
            }

        # Handle file uploads
        elif files:
            if not batch_id:
                raise HTTPException(status_code=400, detail="batch_id required")

            # Validate batch exists
            batch_dir = os.path.join("exports", batch_id)
            if not os.path.exists(os.path.join(batch_dir, "metadata.json")):
                raise HTTPException(
                    status_code=400, detail=f"Invalid batch_id: {batch_id}"
                )

            # Read files into memory
            files_data = []
            for file in files:
                content = await file.read()
                files_data.append((file.filename, content))

            # Batch should already be initialized via /init-batch

            # Start background processing for file uploads
            asyncio.create_task(
                process_with_chunks(
                    batch_id=batch_id,
                    files_data=files_data,
                    client_id=client_id,
                    chunk_size=chunkSize,
                )
            )

            return {
                "batch_id": batch_id,
                "message": "Batch processing started",
                "status": "processing",
            }

        else:
            raise HTTPException(
                status_code=400, detail="Files, zip file, or URLs required"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/check-logo/batch/{batch_id}/complete",
    summary="Mark batch as complete",
    response_description="Batch completion confirmation with results",
)
async def complete_batch(batch_id: str):
    """
    Mark a batch as complete.

    Args:
        batch_id (str): The batch ID to complete.

    Returns:
        dict: Confirmation message and batch results.
    """
    try:
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")

        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        # Read results from CSV
        results = []
        csv_path = metadata["csv_path"]
        if os.path.exists(csv_path):
            with open(csv_path, "r", newline="") as csv_file:
                reader = csv.DictReader(csv_file)
                for row in reader:
                    results.append(row)

        return {"message": "Batch completed successfully", "results": results}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/check-logo/batch/{batch_id}/send-email",
    summary="Send batch summary email notification",
    response_description="Email notification queued",
)
async def send_batch_email(batch_id: str, background_tasks: BackgroundTasks):
    """
    Send batch summary email notification if configured.

    Args:
        batch_id (str): The batch ID to send email for.
        background_tasks (BackgroundTasks): FastAPI background task manager.

    Returns:
        dict: Confirmation message.
    """
    try:
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")

        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        csv_path = metadata["csv_path"]

        # Send email notification if email is provided in metadata
        if "email" in metadata and metadata["email"]:
            try:
                email_to = metadata["email"]
                valid_count = metadata["counts"]["valid"]
                invalid_count = metadata["counts"]["invalid"]

                # Send email notification in background
                background_tasks.add_task(
                    send_batch_summary_email,
                    email_to=email_to,
                    batch_id=batch_id,
                    csv_path=csv_path,
                    valid_count=valid_count,
                    invalid_count=invalid_count,
                )
                logger.info(
                    f"Email notification queued for batch {batch_id} to {email_to}"
                )
                return {"message": "Email notification queued"}
            except Exception as e:
                logger.error(f"Failed to queue email notification: {str(e)}")
                raise HTTPException(
                    status_code=500, detail="Failed to queue email notification"
                )
        else:
            raise HTTPException(
                status_code=400, detail="No email configured for this batch"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending batch email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/check-logo/batch/{batch_id}/status",
    response_model=BatchStatusResponse,
    summary="Get batch processing status",
    response_description="Current status and statistics of the batch",
)
async def get_batch_status(batch_id: str):
    """
    Get the current status of a batch processing job.

    Args:
        batch_id (str): The batch ID to query.

    Returns:
        BatchStatusResponse: Batch status, counts, and progress.
    """
    try:
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")

        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        total = metadata["counts"]["total"]
        progress = (
            100.0
            if total == 0
            else (metadata["counts"]["valid"] + metadata["counts"]["invalid"])
            / total
            * 100
        )

        return BatchStatusResponse(
            batch_id=batch_id,
            status=metadata["status"],
            counts=metadata["counts"],
            progress=progress,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting batch status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/check-logo/batch/{batch_id}/retry-chunk",
    response_model=BatchProcessingResponse,
    summary="Retry a failed chunk",
    response_description="Retry processing results for the specified chunk",
)
@limiter.limit("10/minute")
async def retry_chunk(
    request: Request,
    batch_id: str,
    chunk_index: int = Form(..., description="Index of the chunk to retry"),
    files: Optional[List[UploadFile]] = File(None, description="Files to retry"),
    client_id: Optional[str] = Form(
        None, description="Client ID for WebSocket updates"
    ),
    total_chunks: Optional[int] = Form(None, description="Total number of chunks"),
    total_files: Optional[int] = Form(
        None, description="Total number of files in batch"
    ),
    batch_request: Optional[BatchUrlRequest] = None,
):
    """
    Retry processing a specific chunk that failed.

    This endpoint allows retrying individual chunks that failed during batch processing.
    It maintains the same processing logic as the main batch endpoint but focuses on
    a specific chunk for retry scenarios.

    Args:
        request (Request): The incoming request.
        batch_id (str): The batch ID to retry chunk for.
        chunk_index (int): Index of the chunk to retry.
        files (Optional[List[UploadFile]]): List of files to retry (for file uploads).
        client_id (Optional[str]): Client ID for WebSocket progress updates.
        total_chunks (Optional[int]): Total number of chunks.
        total_files (Optional[int]): Total number of files in batch.
        batch_request (Optional[BatchUrlRequest]): JSON request for URL retries.

    Returns:
        BatchProcessingResponse: Results of the retry attempt.
    """
    logger.info(f"Retrying chunk {chunk_index} for batch {batch_id}")

    # Validate batch exists
    batch_dir = os.path.join("exports", batch_id)
    metadata_path = os.path.join(batch_dir, "metadata.json")
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    # Use the same processing logic as the main batch endpoint
    # but with retry-specific logging and error handling
    try:
        return await check_logo_batch(
            request=request,
            background_tasks=BackgroundTasks(),
            files=files,
            batch_id=batch_id,
            client_id=client_id,
            chunk_index=chunk_index,
            total_chunks=total_chunks,
            total_files=total_files,
            batch_request=batch_request,
        )
    except Exception as e:
        logger.error(
            f"Retry failed for chunk {chunk_index} in batch {batch_id}: {str(e)}"
        )
        # Return error response with chunk status
        return JSONResponse(
            status_code=500,
            content={
                "chunk_status": "error",
                "message": f"Chunk retry failed: {str(e)}",
                "batch_id": batch_id,
                "chunk_index": chunk_index,
                "error": str(e),
            },
        )
