import os
import shutil
from fastapi import UploadFile
from detect_logo import check_logo
import logging

# Configure logging for the module
logger = logging.getLogger(__name__)

# Constants for file upload configuration
UPLOAD_DIR = "temp_uploads"
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg"}


def create_upload_dir():
    """
    Create the upload directory if it doesn't exist.

    Creates a directory for temporary file uploads with appropriate permissions.
    The directory path is specified by UPLOAD_DIR constant.

    Raises:
        RuntimeError: If directory creation fails
    """
    try:
        # Create directory with read/write/execute permissions for owner
        os.makedirs(UPLOAD_DIR, mode=0o755, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create upload directory: {str(e)}")
        raise RuntimeError(f"Failed to create upload directory: {str(e)}")


def is_valid_image(file: UploadFile) -> bool:
    """
    Validate uploaded file as an image.

    Performs multiple validation checks on the uploaded file:
    1. Validates/infers the content type
    2. Ensures content type is in allowed MIME types
    3. Verifies file is not empty by reading a sample

    Args:
        file (UploadFile): FastAPI UploadFile object containing the uploaded file

    Returns:
        bool: True if file is a valid image meeting all criteria, False otherwise

    Note:
        - Checks MIME type against allowed types
        - Validates file is not empty
        - Handles missing content types by inferring from extension
    """
    try:
        # Set default content type if none provided by inferring from extension
        if not file.content_type:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in {".jpg", ".jpeg"}:
                file.content_type = "image/jpeg"
            elif ext == ".png":
                file.content_type = "image/png"

        # Validate that content type is in allowed MIME types
        if file.content_type not in ALLOWED_MIME_TYPES:
            logger.error(f"Invalid content type: {file.content_type}")
            return False

        # Try to read a small part of the file to verify it's not empty
        try:
            file.file.seek(0)  # Reset file pointer to start
            chunk = file.file.read(1024)  # Read first 1KB as sample
            if not chunk:
                logger.error("File is empty")
                return False
            file.file.seek(0)  # Reset pointer for future reads
            return True
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return False

    except Exception as e:
        logger.error(f"Error validating file: {str(e)}")
        return False


def save_temp_file(file: UploadFile) -> str:
    """
    Saves an uploaded file to a temporary location.

    Creates a temporary file from the uploaded content with validation:
    1. Ensures upload directory exists
    2. Reads entire file content
    3. Validates content is not empty
    4. Writes content to disk
    5. Verifies successful write

    Args:
        file (UploadFile): FastAPI UploadFile object containing the file to save

    Returns:
        str: Path to the saved temporary file

    Raises:
        ValueError: If uploaded file is empty
        IOError: If file saving fails
        Exception: For other unexpected errors
    """
    try:
        # Ensure the upload directory exists before saving
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Generate full file path in upload directory
        file_location = os.path.join(UPLOAD_DIR, file.filename)

        # Read the entire file content first to validate
        file.file.seek(0)
        content = file.file.read()
        if not content:
            raise ValueError("Uploaded file is empty")

        # Write validated content to destination file
        with open(file_location, "wb") as buffer:
            buffer.write(content)

        # Verify file was written successfully
        if not os.path.exists(file_location) or os.path.getsize(file_location) == 0:
            raise IOError("Failed to save uploaded file")

        return file_location
    except Exception as e:
        logger.error(f"Error during file saving: {str(e)}")
        raise
