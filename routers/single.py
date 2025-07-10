"""
Single Image Logo Detection Router

This module provides REST API endpoints for detecting logos in single images through various input methods:
- File uploads (JPG, PNG, WEBP, BMP)
- Image URLs
- JSON payload with image URLs

The router implements rate limiting to prevent abuse and provides detailed error handling
with appropriate HTTP status codes.

Routes:
    POST /api/check-logo/single/ - Process uploaded file or image path
    POST /api/check-logo/single/url - Process image from URL in JSON payload

Dependencies:
    - FastAPI for routing
    - YOLO client service for logo detection
    - Validation utilities for image verification
    - Rate limiting for API protection

Author: Symphony AI Team
Version: 1.0.0
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.requests import Request
from models.logo_check import LogoCheckResult, SingleImageUrlRequest
from utils.file_ops import is_valid_image, save_temp_file
from services.yolo_client import yolo_client
from slowapi import Limiter
from slowapi.util import get_remote_address
from PIL import UnidentifiedImageError
import os
import logging

# Initialize logger for this module
logger = logging.getLogger(__name__)

# Initialize rate limiter using client IP address
limiter = Limiter(key_func=get_remote_address)

# Create router for logo detection endpoints
router = APIRouter(prefix="/api/check-logo", tags=["Logo Detection"])


@router.post(
    "/single/",
    response_model=LogoCheckResult,
    summary="Validate a single image for logo presence",
    response_description="Detection result with confidence score and metadata",
)
@limiter.limit("100/minute")  # Rate limit: 100 requests per minute per IP
async def check_logo_single(
    request: Request,
    file: UploadFile = File(None, description="Image file to validate"),
    image_path: str = Form(None, description="URL or path of the image to validate"),
):
    """
    Endpoint to validate a single image for the presence of a Symphony logo.

    This endpoint accepts either a file upload or an image URL/path and performs logo detection.
    The detection is performed using a YOLO-based model optimized for logo recognition.

    Args:
        request (Request): The incoming HTTP request
        file (UploadFile, optional): The uploaded image file
        image_path (str, optional): URL or path to the image

    Returns:
        LogoCheckResult: Object containing:
            - image_path: Path/URL of the processed image
            - is_valid: Boolean indicating logo presence
            - confidence: Detection confidence score (0-1)
            - model: Name of detection model used
            - bbox: Bounding box coordinates if logo detected
            - error: Error message if any

    Raises:
        HTTPException:
            - 400 if invalid input provided
            - 500 if server-side processing error occurs
    """
    try:
        # Handle file upload case
        if file:
            # Validate uploaded file format
            if not is_valid_image(file):
                raise HTTPException(
                    status_code=400, detail="File must be a non-empty JPG or PNG image"
                )

            file_location = ""
            try:
                # Read file content and process with YOLO model
                file_content = await file.read()
                result = await yolo_client.check_logo(
                    file_data=file_content, filename=file.filename
                )
                return LogoCheckResult(**result)
            except (ValueError, IOError) as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                logger.error(f"Error processing file: {str(e)}")
                raise HTTPException(
                    status_code=500, detail=f"Error processing file: {str(e)}"
                )

        # Handle image URL/path case
        elif image_path:
            try:
                # Process image from URL using YOLO model
                result = await yolo_client.check_logo(image_path=image_path)
                return LogoCheckResult(**result)
            except UnidentifiedImageError as e:
                raise HTTPException(
                    status_code=400, detail="Invalid or inaccessible image URL"
                )
            except Exception as e:
                logger.error(f"Error processing image URL: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        else:
            # Neither file nor URL provided
            raise HTTPException(
                status_code=400, detail="Either file or image_path must be provided"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/single/url",
    response_model=LogoCheckResult,
    summary="Validate a single image by URL",
    response_description="Detection result with confidence score and metadata",
)
@limiter.limit("100/minute")  # Rate limit: 100 requests per minute per IP
async def check_logo_single_url(request: Request, image_request: SingleImageUrlRequest):
    """
    Endpoint to validate a single image by URL for Symphony logo presence.

    This endpoint provides a JSON-based interface for logo detection using image URLs.
    It uses the same YOLO-based detection model as the file upload endpoint.

    Args:
        request (Request): The incoming HTTP request
        image_request (SingleImageUrlRequest): Request body containing image URL

    Returns:
        LogoCheckResult: Object containing:
            - image_path: URL of the processed image
            - is_valid: Boolean indicating logo presence
            - confidence: Detection confidence score (0-1)
            - model: Name of detection model used
            - bbox: Bounding box coordinates if logo detected
            - error: Error message if any

    Raises:
        HTTPException:
            - 400 if URL is invalid or image is inaccessible
            - 500 if server-side processing error occurs
    """
    try:
        # Process image URL with YOLO model
        result = await yolo_client.check_logo(image_path=str(image_request.image_path))
        return LogoCheckResult(**result)
    except UnidentifiedImageError as e:
        raise HTTPException(status_code=400, detail="Invalid or inaccessible image URL")
    except Exception as e:
        logger.error(f"Error processing image URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
