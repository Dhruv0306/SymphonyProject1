import asyncio
import httpx
import os
from typing import Dict, Any, Optional
import logging

# Configure logging for the YOLO client module
logger = logging.getLogger(__name__)


class YOLOClient:
    """
    A client for interacting with the YOLO object detection service.

    This class provides an interface to send image data to a YOLO service endpoint
    and receive detection results.
    """

    def __init__(self, base_url: str = None):
        """
        Initialize the YOLO client.

        Args:
            base_url (str, optional): Base URL of the YOLO service. If not provided,
                                    falls back to YOLO_SERVICE_URL environment variable
                                    or default localhost URL.
        """
        self.base_url = base_url or os.getenv(
            "YOLO_SERVICE_URL", "http://localhost:8001"
        )
        # Initialize httpx client with timeout - currently disabled
        # self.client = httpx.AsyncClient(timeout=60.0)

    async def check_logo(
        self,
        image_path: str = None,
        file_data: bytes = None,
        filename: str = None,
        retries: int = 3,
        backoff_factor: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Send an image to the YOLO service for logo detection.

        Args:
            image_path (str, optional): Path or URL to the image file
            file_data (bytes, optional): Raw image data as bytes
            filename (str, optional): Name of the file when sending raw data
            retries (int): Number of retry attempts on failure (default: 3)
            backoff_factor (float): Exponential backoff factor between retries (default: 1.0)

        Returns:
            Dict[str, Any]: Detection results from the YOLO service or error information
        """
        # Implement retry logic with exponential backoff
        for attempt in range(retries):
            try:
                # Create a new client for each request with 60 second timeout
                async with httpx.AsyncClient(timeout=60.0) as client:
                    if file_data and filename:
                        # Handle raw file data upload
                        files = {"file": (filename, file_data)}
                        response = await client.post(
                            f"{self.base_url}/detect", files=files
                        )
                    else:
                        # Handle image path/URL
                        data = {"image_path": image_path}
                        response = await client.post(
                            f"{self.base_url}/detect", data=data
                        )

                    response.raise_for_status()
                    return response.json()

            except httpx.RequestError as e:
                # Handle network-related errors with retry logic
                error_info = f"{type(e).__name__}: {repr(e)}"
                logger.warning(
                    f"[Attempt {attempt+1}/{retries}] YOLO service request failed: {error_info}"
                )
                if attempt < retries - 1:
                    # Implement exponential backoff between retries
                    await asyncio.sleep(backoff_factor * (2**attempt))
                else:
                    # Log final failure and return error response with timeout flag
                    logger.error(f"Final retry failed: {error_info}")
                    is_timeout = self._is_timeout_error(e)
                    return {
                        "Image_Path_or_URL": image_path or filename,
                        "Is_Valid": "Invalid",
                        "Error": f"Service unavailable after retries: {error_info}",
                        "Is_Timeout": is_timeout,
                    }
            except Exception as e:
                # Handle unexpected errors
                error_info = f"{type(e).__name__}: {repr(e)}"
                logger.error(f"YOLO service error: {error_info}")
                return {
                    "Image_Path_or_URL": image_path or filename,
                    "Is_Valid": "Invalid",
                    "Error": error_info,
                }

    def _is_timeout_error(self, error: Exception) -> bool:
        """
        Check if the error is a timeout-related error that should be retried.

        Args:
            error (Exception): The exception to check

        Returns:
            bool: True if it's a timeout error, False otherwise
        """
        error_name = type(error).__name__
        error_str = str(error)
        return (
            error_name in ["WriteTimeout", "ReadTimeout"]
            or "timeout" in error_str.lower()
        )


# Create a default instance of the YOLO client
yolo_client = YOLOClient()
