from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.requests import Request
from models.logo_check import LogoCheckResult, SingleImageUrlRequest
from utils.file_ops import is_valid_image, save_temp_file
from detect_logo import check_logo
from slowapi import Limiter
from slowapi.util import get_remote_address
from PIL import UnidentifiedImageError
import os
import logging

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/api/check-logo",
    tags=["Logo Detection"]
)

@router.post(
    "/single/",
    response_model=LogoCheckResult,
    summary="Validate a single image for logo presence",
    response_description="Detection result with confidence score and metadata"
)
@limiter.limit("100/minute")
async def check_logo_single(
    request: Request,
    file: UploadFile = File(None, description="Image file to validate"),
    image_path: str = Form(None, description="URL or path of the image to validate")
):
    """
    Validate a single image for the presence of a Symphony logo.
    
    Either provide a file upload or an image URL/path.
    
    Returns:
    - Image path/URL
    - Validation result (Valid/Invalid)
    - Confidence score
    - Detection model used
    - Bounding box coordinates (if detected)
    - Error message (if any)
    """
    try:
        if file:
            if not is_valid_image(file):
                raise HTTPException(status_code=400, detail="File must be a non-empty JPG or PNG image")
            
            file_location = ""
            try:
                file_location = save_temp_file(file)
                result = check_logo(file_location)
                return LogoCheckResult(**result)
            except (ValueError, IOError) as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                logger.error(f"Error processing file: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
            finally:
                if file_location and os.path.exists(file_location):
                    try:
                        os.remove(file_location)
                    except Exception as e:
                        logger.error(f"Error removing temporary file: {str(e)}")

        elif image_path:
            try:
                result = check_logo(image_path)
                return LogoCheckResult(**result)
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

@router.post(
    "/single/url",
    response_model=LogoCheckResult,
    summary="Validate a single image by URL",
    response_description="Detection result with confidence score and metadata"
)
@limiter.limit("100/minute")
async def check_logo_single_url(
    request: Request,
    image_request: SingleImageUrlRequest
):
    """
    Validate a single image for the presence of a Symphony logo using its URL.
    
    Accepts a JSON request with an image URL.
    
    Returns:
    - Image URL
    - Validation result (Valid/Invalid)
    - Confidence score
    - Detection model used
    - Bounding box coordinates (if detected)
    - Error message (if any)
    """
    try:
        result = check_logo(str(image_request.image_path))
        return LogoCheckResult(**result)
    except UnidentifiedImageError as e:
        raise HTTPException(status_code=400, detail="Invalid or inaccessible image URL")
    except Exception as e:
        logger.error(f"Error processing image URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))