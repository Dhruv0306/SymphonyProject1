import os
import shutil
from fastapi import UploadFile
from detect_logo import check_logo
from utils.response import format_response
import logging

logger = logging.getLogger(__name__)

UPLOAD_DIR = "temp_uploads"
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/jpg'}

def create_upload_dir():
    try:
        os.makedirs(UPLOAD_DIR, mode=0o755, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create upload directory: {str(e)}")
        raise RuntimeError(f"Failed to create upload directory: {str(e)}")

def is_valid_image(file: UploadFile) -> bool:
    """
    Validate uploaded file as an image.
    
    Args:
        file (UploadFile): FastAPI UploadFile object
    
    Returns:
        bool: True if file is a valid image, False otherwise
    
    Note:
        - Checks MIME type against allowed types
        - Validates file is not empty
        - Handles missing content types by inferring from extension
    """
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

def save_temp_file(file: UploadFile) -> str:
    """Saves an uploaded file to a temporary location and returns the path."""
    try:
        # Ensure the upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        
        # Read the entire file content first
        file.file.seek(0)
        content = file.file.read()
        if not content:
            raise ValueError("Uploaded file is empty")
        
        # Write content to file
        with open(file_location, "wb") as buffer:
            buffer.write(content)
        
        # Verify file exists and has content
        if not os.path.exists(file_location) or os.path.getsize(file_location) == 0:
            raise IOError("Failed to save uploaded file")
            
        return file_location
    except Exception as e:
        logger.error(f"Error during file saving: {str(e)}")
        raise

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