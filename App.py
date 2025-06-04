from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import shutil
import os
import logging
from logging.handlers import RotatingFileHandler
import mimetypes
from detect_logo import check_logo
from fastapi.responses import RedirectResponse
from tqdm import tqdm
from PIL import UnidentifiedImageError
from fastapi.middleware.cors import CORSMiddleware
import concurrent.futures
from threading import Lock
from io import BytesIO
import tempfile
import uvicorn

# Set up logging
LOG_FILE = 'logs.txt'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# Create file handler with rotation
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(LOG_FORMAT))

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
# Remove any existing handlers (including the default console handler)
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)
# Add only the file handler
root_logger.addHandler(file_handler)

# Configure app logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Keep watchfiles suppressed but log to file
watchfiles_logger = logging.getLogger("watchfiles")
watchfiles_logger.setLevel(logging.ERROR)


app = FastAPI()

# Increase the maximum number of files allowed
app.max_files = 5000

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {request.method} {request.url} - Status: {response.status_code}")
    return response

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

UPLOAD_DIR = "temp_uploads"

# Ensure upload directory exists with proper permissions
try:
    os.makedirs(UPLOAD_DIR, mode=0o755, exist_ok=True)
except Exception as e:
    logger.error(f"Failed to create upload directory: {str(e)}")
    raise RuntimeError(f"Failed to create upload directory: {str(e)}")

# Allowed image mime types
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/jpg'}

# Configure thread-safe counters
counter_lock = Lock()

def is_valid_image(file: UploadFile) -> bool:
    """Check if the uploaded file is a valid image"""
    try:
        # Set default content type if none provided
        if not file.content_type:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in {'.jpg', '.jpeg'}:
                file.content_type = 'image/jpeg'
            elif ext == '.png':
                file.content_type = 'image/png'
        
        # Validate content type
        if file.content_type not in ALLOWED_MIME_TYPES:
            logger.error(f"Invalid content type: {file.content_type}")
            return False
            
        # Try to read a small part of the file to verify it's not empty
        try:
            file.file.seek(0)
            chunk = file.file.read(1024)  # Read first 1KB
            if not chunk:
                logger.error("File is empty")
                return False
            file.file.seek(0)  # Reset pointer
            return True
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return False
        
    except Exception as e:
        logger.error(f"Error validating file: {str(e)}")
        return False

def format_response(result: dict) -> dict:
    """Format the response to match the expected model structure"""
    return {
        "Image_Path_or_URL": result["Image Path/URL"],
        "Is_Valid": result["Is Valid"],
        "Error": result.get("Error")
    }

class LogoCheckResult(BaseModel):
    Image_Path_or_URL: str
    Is_Valid: str
    Error: Optional[str] = None

@app.get("/", include_in_schema=False)
async def root():
    # Redirects the root URL to the API documentation for user convenience.
    return RedirectResponse(url="/api")

@app.get("/api")
async def api_explanation():
    """
    Provides a summary of available API endpoints and their usage.
    """
    return {
        "description": "API for validating the presence of a logo in images using YOLO-based detection.",
        "endpoints": [
            {
                "path": "/api/check-logo/single/",
                "method": "POST",
                "description": "Validate a single image (via file upload or image path/URL) for a logo.",
                "request": {
                    "file": "Optional. Upload an image file.",
                    "image_path": "Optional. Provide an image path or URL as a form field."
                },
                "response": {
                    "Image_Path_or_URL": "The path or URL of the processed image.",
                    "Is_Valid": "'Valid' if a logo is detected, otherwise 'Invalid'."
                }
            },
            {
                "path": "/api/check-logo/batch/",
                "method": "POST",
                "description": "Validate multiple images for logos using a semicolon-separated list of paths/URLs.",
                "request": {
                    "paths": "Required. Semicolon-separated string of image paths or URLs."
                },
                "response": [
                    {
                        "Image_Path_or_URL": "The path or URL of the image checked.",
                        "Is_Valid": "'Valid' if a logo is detected, otherwise 'Invalid'."
                    }
                ]
            },
            {
                "path": "/check-logo/batch/getCount",
                "method": "GET",
                "description": "Get the count of valid and invalid logos from the most recent batch process.",
                "response": {
                    "valid": "Number of images with a valid logo.",
                    "invalid": "Number of images without a valid logo.",
                    "total": "Total number of images processed in the last batch."
                }
            }
        ],
        "note": "For single image check, provide either 'file' or 'image_path'. For batch, provide all paths in the 'paths' form field."
    }

@app.post("/api/check-logo/single/", response_model=LogoCheckResult)
async def check_logo_single(
    file: UploadFile = File(None),
    image_path: str = Form(None),
    data: dict = None
):
    """
    Accepts either an uploaded file or an image path/URL.
    Returns whether the image contains a valid logo.
    """
    try:
        # Handle form-encoded data
        if data and 'image_path' in data:
            image_path = data['image_path']

        if file:
            # Ensure the upload directory exists
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            # Validate file type
            if not is_valid_image(file):
                raise HTTPException(status_code=400, detail="File must be a non-empty JPG or PNG image")
            
            # Save uploaded file securely to a temp directory
            file_location = os.path.join(UPLOAD_DIR, file.filename)
            try:
                # Read the entire file content first
                file.file.seek(0)
                content = file.file.read()
                if not content:
                    raise HTTPException(status_code=400, detail="Uploaded file is empty")
                
                # Write content to file
                with open(file_location, "wb") as buffer:
                    buffer.write(content)
                
                # Verify file exists and has content
                if not os.path.exists(file_location):
                    raise HTTPException(status_code=400, detail="Failed to save uploaded file - file does not exist")
                
                if os.path.getsize(file_location) == 0:
                    raise HTTPException(status_code=400, detail="Failed to save uploaded file - file is empty")
                
                # Run logo detection on the saved file
                result = check_logo(file_location)
                return format_response(result)
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error during file handling: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
            finally:
                # Always try to remove temp file
                if os.path.exists(file_location):
                    try:
                        os.remove(file_location)
                    except Exception as e:
                        logger.error(f"Error removing temporary file: {str(e)}")
                        
        elif image_path:
            try:
                result = check_logo(image_path)
                return format_response(result)
            except UnidentifiedImageError as e:
                raise HTTPException(status_code=400, detail="Invalid or inaccessible image URL")
            except Exception as e:
                logger.error(f"Error processing image URL: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail="Either file or image_path must be provided")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def process_single_file(file: UploadFile) -> dict:
    """Process a single uploaded file with logo detection"""
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    try:
        # Save the file
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Reset file pointer
        file.file.seek(0)
        
        # Verify file exists and is readable
        if not os.path.exists(file_location) or os.path.getsize(file_location) == 0:
            return {
                "Image_Path_or_URL": file.filename,
                "Is_Valid": "Invalid",
                "Error": "Failed to save uploaded file"
            }
        
        result = check_logo(file_location)
        return format_response(result)
    finally:
        if os.path.exists(file_location):
            try:
                os.remove(file_location)
            except Exception as e:
                logger.error(f"Error removing temporary file: {str(e)}")

def process_single_path(path: str) -> dict:
    """Process a single image path/URL with logo detection"""
    try:
        result = check_logo(path)
        return format_response(result)
    except Exception as e:
        logger.error(f"Error processing path {path}: {str(e)}")
        return {
            "Image_Path_or_URL": path,
            "Is_Valid": "Invalid",
            "Error": str(e)
        }

@app.post("/api/check-logo/batch/", response_model=List[LogoCheckResult])
async def check_logo_batch(
    files: Optional[List[UploadFile]] = File(None),
    paths: Optional[str] = Form(None)
):
    """
    Accepts either multiple uploaded files or a semicolon-separated string of image paths/URLs.
    Returns a list of logo detection results for each image, along with summary counts.
    Processes images sequentially.
    """
    # Add file limit check
    print(app.max_files)
    if files and len(files) > app.max_files:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum number of files is {app.max_files}"
        )
    
    results = []
    valid_count = 0
    invalid_count = 0

    try:
        # Handle uploaded files
        if files:
            for file in tqdm(files, desc="Processing uploaded files"):
                try:
                    # Create a temporary file
                    temp_file_path = os.path.join(UPLOAD_DIR, f"temp_{file.filename}")
                    with open(temp_file_path, "wb") as buffer:
                        file.file.seek(0)
                        shutil.copyfileobj(file.file, buffer)
                        file.file.seek(0)  # Reset original file pointer

                    # Process the file
                    result = process_single_path(temp_file_path)
                    result["Image_Path_or_URL"] = file.filename  # Use original filename
                    results.append(result)

                    # Update counts
                    if result["Is_Valid"] == "Valid":
                        valid_count += 1
                    else:
                        invalid_count += 1

                    # Clean up temporary file
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)

                except Exception as e:
                    logger.error(f"Error processing file {file.filename}: {str(e)}")
                    results.append({
                        "Image_Path_or_URL": file.filename,
                        "Is_Valid": "Invalid",
                        "Error": f"Error processing file: {str(e)}"
                    })
                    invalid_count += 1

        # Handle URL or path strings
        if paths:
            image_paths = [p.strip() for p in paths.split(";") if p.strip()]
            for path in tqdm(image_paths, desc="Processing image paths"):
                try:
                    result = process_single_path(path)
                    results.append(result)
                    if result["Is_Valid"] == "Valid":
                        valid_count += 1
                    else:
                        invalid_count += 1
                except Exception as e:
                    logger.error(f"Error processing path {path}: {str(e)}")
                    results.append({
                        "Image_Path_or_URL": path,
                        "Is_Valid": "Invalid",
                        "Error": str(e)
                    })
                    invalid_count += 1

        # Store batch summary in app state
        app.state.last_batch_counts = {
            "valid": valid_count,
            "invalid": invalid_count,
            "total": len(results)
        }
        
        return results
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check-logo/batch/getCount")
async def get_last_batch_count():
    """
    Returns the count of valid and invalid logos from the most recent batch process.
    """
    counts = getattr(app.state, "last_batch_counts", None)
    if counts is None:
        return {"detail": "No batch has been processed yet."}
    return counts

if __name__ == "__main__":
    uvicorn.run(
        "App:app",
        host="0.0.0.0",
        port=8000,
        limit_concurrency=1000,
        limit_max_requests=5000,
    )