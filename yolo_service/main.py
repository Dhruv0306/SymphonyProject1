"""
YOLO Logo Detection Service API

This module implements a FastAPI application providing logo detection services using YOLO models.
It offers endpoints for processing both uploaded files and image URLs, returning standardized
detection results with confidence scores and bounding boxes.

Features:
    - Logo detection from uploaded image files
    - Logo detection from image URLs or paths
    - Health monitoring endpoint
    - Standardized response format

Dependencies:
    - FastAPI for API framework
    - Pydantic for request/response modeling
    - detect_logo for YOLO model integration

Author: Symphony AI Team
Version: 1.0.0
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from detect_logo import check_logo
import detect_logo

print(f"[DEBUG] detect_logo loaded from: {detect_logo.__file__}")


# Initialize FastAPI application with metadata
app = FastAPI(title="YOLO Logo Detection Service", version="1.0.0")


class DetectionRequest(BaseModel):
    """
    Request model for logo detection using image path.

    Attributes:
        image_path (str): Path to the image file to analyze
    """

    image_path: str


class DetectionResponse(BaseModel):
    """
    Response model for logo detection results.

    Attributes:
        Image_Path_or_URL (str): Path or URL of the processed image
        Is_Valid (str): Whether a valid logo was detected ('Valid' or 'Invalid')
        Confidence (float, optional): Confidence score of the detection (0-1)
        Detected_By (str, optional): Model/method used for detection
        Bounding_Box (dict, optional): Coordinates of detected logo
        Error (str, optional): Error message if detection failed
    """

    Image_Path_or_URL: str
    Is_Valid: str
    Confidence: Optional[float] = None
    Detected_By: Optional[str] = None
    Bounding_Box: Optional[dict] = None
    Error: Optional[str] = None


@app.post("/detect", response_model=DetectionResponse)
async def detect_logo_endpoint(
    file: UploadFile = File(None), image_path: str = Form(None)
):
    """
    Endpoint for logo detection in images.

    This endpoint accepts either an uploaded file or an image path/URL and processes
    the image using YOLO models to detect Symphony logos. It handles file uploads with
    proper temporary file management and supports remote image URLs.

    Args:
        file (UploadFile, optional): Uploaded image file
        image_path (str, optional): URL or path to image file

    Returns:
        DetectionResponse: Results of logo detection including:
            - Image path/URL
            - Validation result
            - Confidence score (if detected)
            - Detection model used
            - Bounding box coordinates (if detected)

    Raises:
        HTTPException:
            - 400 if neither file nor image_path is provided or if they are invalid
            - 500 if a server-side error occurs during processing
    """
    if file:
        # Create temporary file to store uploaded image
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f".{file.filename.split('.')[-1]}"
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Process image and get detection results
            result = check_logo(tmp_path)
            result["Image_Path_or_URL"] = file.filename
            return DetectionResponse(**result)
        finally:
            # Clean up temporary file to prevent storage leaks
            os.unlink(tmp_path)

    elif image_path:
        # Process image from provided path or URL
        if not image_path.strip():
            raise HTTPException(status_code=400, detail="image_path is empty.")
        result = check_logo(image_path)
        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500, detail=f"Invalid result format: {result}"
            )
        return DetectionResponse(**result)

    else:
        # Raise error if no input is provided
        raise HTTPException(
            status_code=400, detail="Either file or image_path required"
        )


@app.get("/health")
async def health_check():
    """
    Simple health check endpoint to verify service status.

    This endpoint is useful for monitoring and health checks in containerized environments
    and orchestration systems like Kubernetes.

    Returns:
        dict: Status message indicating service health
    """
    return {"status": "healthy"}
