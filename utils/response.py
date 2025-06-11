from pydantic import BaseModel, Field
from typing import Optional

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class LogoDetectionResponse(BaseModel):
    Image_Path_or_URL: str
    Is_Valid: str
    Confidence: Optional[float] = Field(None, example=0.87)
    Detected_By: Optional[str] = Field(None, example="yolov8s_logo_detection2")
    Bounding_Box: Optional[BoundingBox] = None
    Error: Optional[str] = None