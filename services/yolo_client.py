import asyncio
import httpx
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class YOLOClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv(
            "YOLO_SERVICE_URL", "http://localhost:8001"
        )
        # self.client = httpx.AsyncClient(timeout=60.0)

    async def check_logo(
        self,
        image_path: str = None,
        file_data: bytes = None,
        filename: str = None,
        retries: int = 3,
        backoff_factor: float = 1.0,
    ) -> Dict[str, Any]:
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    if file_data and filename:
                        files = {"file": (filename, file_data)}
                        response = await client.post(
                            f"{self.base_url}/detect", files=files
                        )
                    else:
                        data = {"image_path": image_path}
                        response = await client.post(
                            f"{self.base_url}/detect", data=data
                        )

                    response.raise_for_status()
                    return response.json()

            except httpx.RequestError as e:
                error_info = f"{type(e).__name__}: {repr(e)}"
                logger.warning(
                    f"[Attempt {attempt+1}/{retries}] YOLO service request failed: {error_info}"
                )
                if attempt < retries - 1:
                    await asyncio.sleep(backoff_factor * (2**attempt))
                else:
                    logger.error(f"Final retry failed: {error_info}")
                    return {
                        "Image_Path_or_URL": image_path or filename,
                        "Is_Valid": "Invalid",
                        "Error": f"Service unavailable after retries: {error_info}",
                    }
            except Exception as e:
                error_info = f"{type(e).__name__}: {repr(e)}"
                logger.error(f"YOLO service error: {error_info}")
                return {
                    "Image_Path_or_URL": image_path or filename,
                    "Is_Valid": "Invalid",
                    "Error": error_info,
                }


yolo_client = YOLOClient()
