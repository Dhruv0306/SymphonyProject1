import httpx
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class YOLOClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("YOLO_SERVICE_URL", "http://localhost:8001")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def check_logo(self, image_path: str = None, file_data: bytes = None, filename: str = None) -> Dict[str, Any]:
        try:
            if file_data and filename:
                files = {"file": (filename, file_data)}
                response = await self.client.post(f"{self.base_url}/detect", files=files)
            elif image_path:
                data = {"image_path": image_path}
                response = await self.client.post(f"{self.base_url}/detect", data=data)
            else:
                raise ValueError("Either image_path or file_data+filename required")
            
            response.raise_for_status()
            return response.json()
        
        except httpx.RequestError as e:
            logger.error(f"YOLO service request failed: {e}")
            return {
                "Image_Path_or_URL": image_path or filename,
                "Is_Valid": "Invalid",
                "Error": f"Service unavailable: {str(e)}"
            }
        except Exception as e:
            logger.error(f"YOLO service error: {e}")
            return {
                "Image_Path_or_URL": image_path or filename,
                "Is_Valid": "Invalid", 
                "Error": str(e)
            }

yolo_client = YOLOClient()