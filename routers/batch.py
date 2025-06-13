from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.requests import Request
from typing import List, Optional
from models.logo_check import (
    LogoCheckResult,
    BatchUrlRequest,
    BatchProcessingResponse,
    BatchStartResponse,
    BatchStatusResponse
)
from detect_logo import check_logo
from utils.file_ops import UPLOAD_DIR
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
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

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
            }
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "An unexpected error occurred"
                    }
                }
            }
        }
    }
)

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
                        "message": "Batch processing session started"
                    }
                }
            }
        }
    }
)
async def start_batch(request: Request):
    """
    Initialize a new batch processing session.

    Creates necessary directories and files for batch tracking.
    Use the returned batch_id in subsequent batch processing requests.

    Returns:
        BatchStartResponse: Contains the batch ID and success message
            - batch_id: Unique identifier for the batch session
            - message: Confirmation message
    """
    try:
        batch_id = str(uuid.uuid4())
        batch_dir = os.path.join("data", batch_id)
        os.makedirs(batch_dir, exist_ok=True)

        # Create CSV file for this batch
        csv_path = os.path.join(batch_dir, 'results.csv')
        with open(csv_path, 'w', newline='') as csv_file:
            fieldnames = ['Image_Path_or_URL', 'Is_Valid', 'Confidence', 'Detected_By', 'Bounding_Box', 'Error']
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

        # Store metadata in a JSON file
        metadata = {
            "csv_path": csv_path,
            "counts": {"valid": 0, "invalid": 0, "total": 0},
            "status": "initialized"
        }
        with open(os.path.join(batch_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f)

        return BatchStartResponse(batch_id=batch_id)
    
    except Exception as e:
        logger.error(f"Error starting new batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/check-logo/batch/",
    response_model=BatchProcessingResponse,
    summary="Process multiple images for logo detection",
    response_description="Batch processing results with individual detection results",
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
                                    "y2": 350
                                }
                            },
                            {
                                "Image_Path_or_URL": "example2.jpg",
                                "Is_Valid": "Invalid",
                                "Confidence": None,
                                "Detected_By": None,
                                "Bounding_Box": None,
                                "Error": "No logo detected"
                            }
                        ]
                    }
                }
            }
        },
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid request format or missing required fields"
                    }
                }
            }
        }
    }
)
@limiter.limit("20/minute")
async def check_logo_batch(
    request: Request,
    files: Optional[List[UploadFile]] = File(None, description="List of image files to validate"),
    batch_id: Optional[str] = Form(None, description="Optional batch ID for tracking progress"),
    batch_request: Optional[BatchUrlRequest] = None
):
    """
    Process multiple images for logo detection.

    This endpoint supports two modes of operation:
    1. File Upload Mode:
       - Submit images as multipart/form-data
       - Use the 'files' parameter to upload multiple images
       - Optionally include a batch_id for progress tracking

    2. URL Processing Mode:
       - Submit a JSON request with image URLs
       - Use the 'image_paths' parameter with a list of URLs
       - Optionally include a batch_id for progress tracking

    Rate Limiting:
    - 20 requests per minute
    - Automatic retry with exponential backoff
    - Progress tracking available through batch_id

    Args:
        request: The incoming request
        files: List of image files (for multipart/form-data)
        batch_id: Optional tracking ID (for multipart/form-data)
        batch_request: JSON request body (for URL processing)

    Returns:
        BatchProcessingResponse: Processing results including:
            - batch_id: Unique identifier (if provided)
            - total_processed: Number of images processed
            - valid_count: Number of valid logos detected
            - invalid_count: Number of invalid or failed detections
            - results: List of individual detection results

    Raises:
        HTTPException: 
            - 400: Invalid request format
            - 429: Rate limit exceeded
            - 500: Server processing error
    """
    results = []
    valid_count = 0
    invalid_count = 0
    
    try:
        # Log request details
        content_type = request.headers.get('content-type', '')
        logger.info(f"Received batch request with content-type: {content_type}")
        
        # Handle JSON request for URLs
        if 'application/json' in content_type:
            if not batch_request:
                raw_body = await request.json()
                logger.info(f"Processing JSON request: {raw_body}")
                try:
                    batch_request = BatchUrlRequest(**raw_body)
                except Exception as e:
                    logger.error(f"Failed to parse JSON request: {str(e)}")
                    raise HTTPException(status_code=400, detail=f"Invalid request format: {str(e)}")
            
            if not batch_request.image_paths:
                raise HTTPException(status_code=400, detail="No image URLs provided")
            
            logger.info(f"Processing {len(batch_request.image_paths)} URLs")
            batch_id = batch_request.batch_id
        
        # Get batch_id from either form data or JSON request
        batch_id = batch_id or (batch_request.batch_id if batch_request else None)
        logger.info(f"Using batch_id: {batch_id}")

        # Validate and setup batch tracking if batch_id provided
        metadata = None
        csv_writer = None
        csv_file = None
        
        if batch_id:
            batch_dir = os.path.join("data", batch_id)
            metadata_path = os.path.join(batch_dir, 'metadata.json')
            if not os.path.exists(metadata_path):
                raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            csv_path = metadata["csv_path"]
            csv_file = open(csv_path, 'a', newline='')
            csv_writer = csv.DictWriter(csv_file, fieldnames=['Image_Path_or_URL', 'Is_Valid', 'Confidence', 'Detected_By', 'Bounding_Box', 'Error'])

        try:
            # Handle uploaded files
            if files:
                logger.info(f"Processing {len(files)} uploaded files")
                for file in tqdm(files, desc="Processing uploaded files"):
                    try:
                        temp_file_path = os.path.join(UPLOAD_DIR, f"temp_{file.filename}")
                        with open(temp_file_path, "wb") as buffer:
                            file.file.seek(0)
                            shutil.copyfileobj(file.file, buffer)
                            file.file.seek(0)

                        result = check_logo(temp_file_path)
                        result["Image_Path_or_URL"] = file.filename
                        
                        # Convert to Pydantic model
                        result_model = LogoCheckResult(**result)
                        results.append(result_model)

                        # Write to CSV if tracking enabled
                        if csv_writer:
                            csv_writer.writerow(result_model.dict())

                        if result["Is_Valid"] == "Valid":
                            valid_count += 1
                        else:
                            invalid_count += 1

                        if os.path.exists(temp_file_path):
                            os.remove(temp_file_path)

                    except Exception as e:
                        logger.error(f"Error processing file {file.filename}: {str(e)}")
                        error_result = LogoCheckResult(
                            Image_Path_or_URL=file.filename,
                            Is_Valid="Invalid",
                            Confidence=None,
                            Detected_By=None,
                            Bounding_Box=None,
                            Error=f"Error processing file: {str(e)}"
                        )
                        results.append(error_result)
                        if csv_writer:
                            csv_writer.writerow(error_result.dict())
                        invalid_count += 1

            # Handle URL requests
            if batch_request and batch_request.image_paths:
                logger.info(f"Processing {len(batch_request.image_paths)} URLs")
                for url in tqdm(batch_request.image_paths, desc="Processing image URLs"):
                    try:
                        logger.info(f"Processing URL: {url}")
                        result = check_logo(str(url))
                        logger.info(f"URL processing result: {result}")
                        
                        result_model = LogoCheckResult(**result)
                        results.append(result_model)
                        
                        if csv_writer:
                            csv_writer.writerow(result_model.dict())

                        if result["Is_Valid"] == "Valid":
                            valid_count += 1
                        else:
                            invalid_count += 1
                    except Exception as e:
                        logger.error(f"Error processing URL {url}: {str(e)}")
                        error_result = LogoCheckResult(
                            Image_Path_or_URL=str(url),
                            Is_Valid="Invalid",
                            Confidence=None,
                            Detected_By=None,
                            Bounding_Box=None,
                            Error=str(e)
                        )
                        results.append(error_result)
                        if csv_writer:
                            csv_writer.writerow(error_result.dict())
                        invalid_count += 1

            # Update batch metadata if tracking enabled
            if batch_id and metadata:
                metadata["counts"]["valid"] += valid_count
                metadata["counts"]["invalid"] += invalid_count
                metadata["counts"]["total"] += len(results)
                metadata["status"] = "completed"
                
                batch_dir = os.path.join("data", batch_id)
                metadata_path = os.path.join(batch_dir, 'metadata.json')
                with open(metadata_path, 'w') as f:
                    json.dump(metadata, f)

            if csv_file:
                csv_file.close()

            response = BatchProcessingResponse(
                batch_id=batch_id if batch_id else str(uuid.uuid4()),
                total_processed=len(results),
                valid_count=valid_count,
                invalid_count=invalid_count,
                results=results
            )
            logger.info(f"Batch processing completed. Response: {response}")
            return response
            
        except Exception as e:
            if csv_file:
                csv_file.close()
            logger.error(f"Error in batch processing: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in batch processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/check-logo/batch/{batch_id}/status",
    response_model=BatchStatusResponse,
    summary="Get batch processing status",
    response_description="Current status and statistics of the batch"
)
async def get_batch_status(batch_id: str):
    """
    Get the current status of a batch processing job.
    
    Returns:
    - Batch ID
    - Current status
    - Count statistics
    - Progress percentage
    """
    try:
        batch_dir = os.path.join("data", batch_id)
        metadata_path = os.path.join(batch_dir, 'metadata.json')
        
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
            
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            
        total = metadata["counts"]["total"]
        progress = 100.0 if total == 0 else (metadata["counts"]["valid"] + metadata["counts"]["invalid"]) / total * 100
            
        return BatchStatusResponse(
            batch_id=batch_id,
            status=metadata["status"],
            counts=metadata["counts"],
            progress=progress
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting batch status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))