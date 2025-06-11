from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.requests import Request
from utils.response import LogoDetectionResponse
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

@router.post("/single/", response_model=LogoDetectionResponse)
@limiter.limit("100/minute")
async def check_logo_single(
    request: Request,
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
            if not is_valid_image(file):
                raise HTTPException(status_code=400, detail="File must be a non-empty JPG or PNG image")
            
            file_location = ""
            try:
                file_location = save_temp_file(file)
                return check_logo(file_location)
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
                return check_logo(image_path)
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