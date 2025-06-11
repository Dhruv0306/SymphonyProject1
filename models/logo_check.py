from pydantic import BaseModel
from typing import Optional

class LogoCheckResult(BaseModel):
    Image_Path_or_URL: str
    Is_Valid: str
    Error: Optional[str] = None