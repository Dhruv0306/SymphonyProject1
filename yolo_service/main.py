from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
from detect_logo import check_logo

app = FastAPI(title="YOLO Logo Detection Service", version="1.0.0")

class DetectionRequest(BaseModel):
    image_path: str

class DetectionResponse(BaseModel):
    Image_Path_or_URL: str
    Is_Valid: str
    Confidence: Optional[float] = None
    Detected_By: Optional[str] = None
    Bounding_Box: Optional[dict] = None
    Error: Optional[str] = None

@app.post("/detect", response_model=DetectionResponse)
async def detect_logo_endpoint(
    file: UploadFile = File(None),
    image_path: str = Form(None)
):
    if file:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            result = check_logo(tmp_path)
            result["Image_Path_or_URL"] = file.filename
            return DetectionResponse(**result)
        finally:
            os.unlink(tmp_path)
    
    elif image_path:
        result = check_logo(image_path)
        return DetectionResponse(**result)
    
    else:
        raise HTTPException(status_code=400, detail="Either file or image_path required")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}