from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Union


class BoundingBox(BaseModel):
    """Represents the coordinates of a detected logo in an image."""

    x1: int = Field(
        ..., description="Left coordinate of the bounding box", example=100, ge=0
    )
    y1: int = Field(
        ..., description="Top coordinate of the bounding box", example=150, ge=0
    )
    x2: int = Field(
        ..., description="Right coordinate of the bounding box", example=300, ge=0
    )
    y2: int = Field(
        ..., description="Bottom coordinate of the bounding box", example=350, ge=0
    )

    class Config:
        schema_extra = {"example": {"x1": 100, "y1": 150, "x2": 300, "y2": 350}}


class LogoCheckResult(BaseModel):
    """Response model for logo detection results."""

    Image_Path_or_URL: str = Field(
        ..., description="Path or URL of the processed image", example="example.jpg"
    )
    Is_Valid: str = Field(
        ...,
        description="Whether the logo is valid ('Valid' or 'Invalid')",
        example="Valid",
    )
    Confidence: Optional[float] = Field(
        None,
        description="Confidence score of the detection (0.0 to 1.0)",
        example=0.87,
        ge=0.0,
        le=1.0,
    )
    Detected_By: Optional[str] = Field(
        None,
        description="Name of the YOLO model that detected the logo",
        example="yolov8s_logo_detection2",
    )
    Bounding_Box: Optional[BoundingBox] = Field(
        None, description="Coordinates of the detected logo"
    )
    Error: Optional[str] = Field(
        None,
        description="Error message if processing failed",
        example="Failed to download image from URL",
    )

    class Config:
        schema_extra = {
            "example": {
                "Image_Path_or_URL": "example.jpg",
                "Is_Valid": "Valid",
                "Confidence": 0.87,
                "Detected_By": "yolov8s_logo_detection2",
                "Bounding_Box": {"x1": 100, "y1": 150, "x2": 300, "y2": 350},
                "Error": None,
            }
        }


class SingleImageUrlRequest(BaseModel):
    """Request model for single image URL validation."""

    image_path: HttpUrl = Field(
        ...,
        description="URL of the image to validate",
        example="https://example.com/image.jpg",
    )

    class Config:
        schema_extra = {"example": {"image_path": "https://example.com/image.jpg"}}


class BatchUrlRequest(BaseModel):
    """Request model for batch URL validation."""

    image_paths: List[HttpUrl] = Field(
        ...,
        description="List of image URLs to validate",
        min_items=1,
        example=["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    )
    batch_id: Optional[str] = Field(
        None,
        description="Optional batch ID for tracking progress",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    email: Optional[str] = Field(
        None,
        description="Email address for batch completion notification",
        example="user@example.com",
    )
    chunk_index: Optional[int] = Field(
        None,
        description="Current chunk index (0-based)",
        example=0,
    )
    total_chunks: Optional[int] = Field(
        None,
        description="Total number of chunks",
        example=4,
    )
    total_files: Optional[int] = Field(
        None,
        description="Total number of files in the entire batch",
        example=100,
    )
    client_id: Optional[str] = Field(
        None,
        description="Client ID for WebSocket updates",
        example="3ba569a2-58d3-4217-86f2-65d7afb89a23",
    )

    class Config:
        schema_extra = {
            "example": {
                "image_paths": [
                    "https://example.com/image1.jpg",
                    "https://example.com/image2.jpg",
                ],
                "batch_id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "chunk_index": 0,
                "total_chunks": 4,
                "total_files": 100,
            }
        }


class BatchProcessingResponse(BaseModel):
    """Response model for batch processing status."""

    batch_id: str = Field(
        ...,
        description="Unique identifier for the batch",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    total_processed: int = Field(
        ..., description="Total number of images processed", example=2, ge=0
    )
    valid_count: int = Field(
        ..., description="Number of valid logos detected", example=1, ge=0
    )
    invalid_count: int = Field(
        ..., description="Number of invalid or failed detections", example=1, ge=0
    )
    results: List[LogoCheckResult] = Field(
        ..., description="List of individual detection results"
    )

    class Config:
        schema_extra = {
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
                        "Detected_By": "yolov8s_logo_detection2",
                        "Bounding_Box": {"x1": 100, "y1": 150, "x2": 300, "y2": 350},
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


class BatchStartResponse(BaseModel):
    """Response model for batch initialization."""

    batch_id: str = Field(
        ...,
        description="Unique identifier for the batch session",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    message: str = Field(
        ..., description="Success message", example="Batch processing session started"
    )

    class Config:
        schema_extra = {
            "example": {
                "batch_id": "550e8400-e29b-41d4-a716-446655440000",
                "message": "Batch processing session started",
            }
        }


class BatchStatusResponse(BaseModel):
    """Response model for batch status check."""

    batch_id: str = Field(
        ...,
        description="Batch identifier",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    status: str = Field(
        ...,
        description="Current status of the batch (pending, processing, completed, failed)",
        example="completed",
    )
    progress: Optional[Dict] = Field(
        None,
        description="Progress information if available",
        example={"total": 100, "processed": 45, "percent_complete": 45.0},
    )

    class Config:
        schema_extra = {
            "example": {
                "batch_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "completed",
                "progress": {"total": 100, "processed": 45, "percent_complete": 45.0},
            }
        }
