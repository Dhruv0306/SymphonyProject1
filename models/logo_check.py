from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Union


class BoundingBox(BaseModel):
    """
    Represents the coordinates of a detected logo in an image.

    Attributes:
        x1 (int): Left coordinate of the bounding box
        y1 (int): Top coordinate of the bounding box
        x2 (int): Right coordinate of the bounding box
        y2 (int): Bottom coordinate of the bounding box
    """

    # Left coordinate must be >= 0
    x1: int = Field(
        ..., description="Left coordinate of the bounding box", example=100, ge=0
    )
    # Top coordinate must be >= 0
    y1: int = Field(
        ..., description="Top coordinate of the bounding box", example=150, ge=0
    )
    # Right coordinate must be >= 0
    x2: int = Field(
        ..., description="Right coordinate of the bounding box", example=300, ge=0
    )
    # Bottom coordinate must be >= 0
    y2: int = Field(
        ..., description="Bottom coordinate of the bounding box", example=350, ge=0
    )

    class Config:
        schema_extra = {"example": {"x1": 100, "y1": 150, "x2": 300, "y2": 350}}


class LogoCheckResult(BaseModel):
    """
    Response model for logo detection results.

    Attributes:
        Image_Path_or_URL (str): Path or URL of the processed image
        Is_Valid (str): Whether the logo is valid ('Valid' or 'Invalid')
        Confidence (Optional[float]): Confidence score of the detection (0.0 to 1.0)
        Detected_By (Optional[str]): Name of the YOLO model that detected the logo
        Bounding_Box (Optional[BoundingBox]): Coordinates of the detected logo
        Error (Optional[str]): Error message if processing failed
    """

    # Path or URL of the image that was processed
    Image_Path_or_URL: str = Field(
        ..., description="Path or URL of the processed image", example="example.jpg"
    )
    # Validation result - either 'Valid' or 'Invalid'
    Is_Valid: str = Field(
        ...,
        description="Whether the logo is valid ('Valid' or 'Invalid')",
        example="Valid",
    )
    # Confidence score between 0 and 1
    Confidence: Optional[float] = Field(
        None,
        description="Confidence score of the detection (0.0 to 1.0)",
        example=0.87,
        ge=0.0,
        le=1.0,
    )
    # Model name that performed the detection
    Detected_By: Optional[str] = Field(
        None,
        description="Name of the YOLO model that detected the logo",
        example="yolov8s_logo_detection2",
    )
    # Bounding box coordinates if logo was detected
    Bounding_Box: Optional[BoundingBox] = Field(
        None, description="Coordinates of the detected logo"
    )
    # Error message in case of processing failure
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
    """
    Request model for single image URL validation.

    Attributes:
        image_path (HttpUrl): URL of the image to validate
    """

    # URL of the image to be validated
    image_path: HttpUrl = Field(
        ...,
        description="URL of the image to validate",
        example="https://example.com/image.jpg",
    )

    class Config:
        schema_extra = {"example": {"image_path": "https://example.com/image.jpg"}}


class BatchUrlRequest(BaseModel):
    """
    Request model for batch URL validation.

    Attributes:
        image_paths (List[HttpUrl]): List of image URLs to validate
        batch_id (Optional[str]): Optional batch ID for tracking progress
        email (Optional[str]): Email address for batch completion notification
        chunk_index (Optional[int]): Current chunk index (0-based)
        total_chunks (Optional[int]): Total number of chunks
        total_files (Optional[int]): Total number of files in the entire batch
        client_id (Optional[str]): Client ID for WebSocket updates
    """

    # List of image URLs to process in batch
    image_paths: List[HttpUrl] = Field(
        ...,
        description="List of image URLs to validate",
        min_items=1,
        example=["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    )
    # Optional batch identifier for tracking
    batch_id: Optional[str] = Field(
        None,
        description="Optional batch ID for tracking progress",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    # Email for notification when batch completes
    email: Optional[str] = Field(
        None,
        description="Email address for batch completion notification",
        example="user@example.com",
    )
    # Current chunk being processed (0-based index)
    chunk_index: Optional[int] = Field(
        None,
        description="Current chunk index (0-based)",
        example=0,
    )
    # Total number of chunks in the batch
    total_chunks: Optional[int] = Field(
        None,
        description="Total number of chunks",
        example=4,
    )
    # Total number of files across all chunks
    total_files: Optional[int] = Field(
        None,
        description="Total number of files in the entire batch",
        example=100,
    )
    # Client identifier for WebSocket communication
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
    """
    Response model for batch processing status.

    Attributes:
        batch_id (str): Unique identifier for the batch
        total_processed (int): Total number of images processed
        valid_count (int): Number of valid logos detected
        invalid_count (int): Number of invalid or failed detections
        results (List[LogoCheckResult]): List of individual detection results
    """

    # Unique identifier for this batch
    batch_id: str = Field(
        ...,
        description="Unique identifier for the batch",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    # Count of processed images
    total_processed: int = Field(
        ..., description="Total number of images processed", example=2, ge=0
    )
    # Count of valid logo detections
    valid_count: int = Field(
        ..., description="Number of valid logos detected", example=1, ge=0
    )
    # Count of invalid/failed detections
    invalid_count: int = Field(
        ..., description="Number of invalid or failed detections", example=1, ge=0
    )
    # List of results for each image
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
    """
    Response model for batch initialization.

    Attributes:
        batch_id (str): Unique identifier for the batch session
        message (str): Success message
    """

    # Unique identifier for the batch
    batch_id: str = Field(
        ...,
        description="Unique identifier for the batch session",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    # Status message
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
    """
    Response model for batch status check.

    Attributes:
        batch_id (str): Batch identifier
        status (str): Current status of the batch
        counts (Dict): Count information
        progress (float): Progress percentage (0.0 to 100.0)
    """

    # Batch identifier
    batch_id: str = Field(
        ...,
        description="Batch identifier",
        example="550e8400-e29b-41d4-a716-446655440000",
    )
    # Current processing status
    status: str = Field(
        ...,
        description="Current status of the batch (pending, processing, completed, failed)",
        example="completed",
    )
    # Counts of valid/invalid/total
    counts: Dict = Field(
        ...,
        description="Count information",
        example={"valid": 10, "invalid": 5, "total": 15},
    )
    # Progress percentage
    progress: float = Field(
        ...,
        description="Progress percentage (0.0 to 100.0)",
        example=75.0,
    )

    class Config:
        schema_extra = {
            "example": {
                "batch_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "completed",
                "progress": {"total": 100, "processed": 45, "percent_complete": 45.0},
            }
        }
