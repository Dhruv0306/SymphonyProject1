from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Union

class BoundingBox(BaseModel):
    """Represents the coordinates of a detected logo in an image."""
    x1: int = Field(..., description="Left coordinate of the bounding box")
    y1: int = Field(..., description="Top coordinate of the bounding box")
    x2: int = Field(..., description="Right coordinate of the bounding box")
    y2: int = Field(..., description="Bottom coordinate of the bounding box")

class LogoCheckResult(BaseModel):
    """Response model for logo detection results."""
    Image_Path_or_URL: str = Field(..., description="Path or URL of the processed image")
    Is_Valid: str = Field(..., description="Whether the logo is valid ('Valid' or 'Invalid')")
    Confidence: Optional[float] = Field(None, description="Confidence score of the detection", example=0.87)
    Detected_By: Optional[str] = Field(None, description="Name of the YOLO model that detected the logo", example="yolov8s_logo_detection2")
    Bounding_Box: Optional[BoundingBox] = Field(None, description="Coordinates of the detected logo")
    Error: Optional[str] = Field(None, description="Error message if processing failed")

class SingleImageUrlRequest(BaseModel):
    """Request model for single image URL validation."""
    image_path: HttpUrl = Field(..., description="URL of the image to validate")

class BatchUrlRequest(BaseModel):
    """Request model for batch URL validation."""
    image_paths: List[HttpUrl] = Field(..., description="List of image URLs to validate", min_items=1)
    batch_id: Optional[str] = Field(None, description="Optional batch ID for tracking progress")

class BatchProcessingResponse(BaseModel):
    """Response model for batch processing status."""
    batch_id: str = Field(..., description="Unique identifier for the batch")
    total_processed: int = Field(..., description="Total number of images processed")
    valid_count: int = Field(..., description="Number of valid logos detected")
    invalid_count: int = Field(..., description="Number of invalid or failed detections")
    results: List[LogoCheckResult] = Field(..., description="List of individual detection results")

class BatchStartResponse(BaseModel):
    """Response model for starting a new batch."""
    batch_id: str = Field(..., description="Unique identifier for the new batch")
    message: str = Field("Batch processing started successfully", description="Status message")

class BatchStatusResponse(BaseModel):
    """Response model for batch status."""
    batch_id: str = Field(..., description="Batch identifier")
    status: str = Field(..., description="Current status of the batch")
    counts: Dict[str, int] = Field(..., description="Count statistics for the batch")
    progress: float = Field(..., description="Progress percentage", ge=0, le=100) 