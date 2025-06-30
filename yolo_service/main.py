from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
from yolo_service.detect_logo import check_logo
import yolo_service.detect_logo as detect_logo
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
        Is_Valid (str): Whether a valid logo was detected
        Confidence (float, optional): Confidence score of the detection
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
    Accepts either an uploaded file or an image path.

    Args:
        file (UploadFile, optional): Uploaded image file
        image_path (str, optional): Path to image file

    Returns:
        DetectionResponse: Results of logo detection

    Raises:
        HTTPException: If neither file nor image_path is provided
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
            # Clean up temporary file
            os.unlink(tmp_path)

    elif image_path:
        # Process image from provided path
        if not image_path.strip():
            raise HTTPException(status_code=400, detail="image_path is empty.")
        result = check_logo(image_path)
        if not isinstance(result, dict):
            raise HTTPException(status_code=500, detail=f"Invalid result format: {result}")
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

    Returns:
        dict: Status message indicating service health
    """
    return {"status": "healthy"}
