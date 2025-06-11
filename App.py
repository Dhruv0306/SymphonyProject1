"""
FastAPI Application for Logo Detection Service

This module initializes the FastAPI application and registers the API routers.
"""

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from utils.logger import setup_logging
from utils.file_ops import create_upload_dir
from routers import single, batch, export
import logging

# Setup logging
logger = setup_logging()

# Initialize FastAPI application
app = FastAPI(
    title="Symphony Logo Detection API",
    description="API service for detecting Symphony logos in images using YOLO models",
    version="1.0.0"
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming HTTP requests and their responses"""
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {request.method} {request.url} - Status: {response.status_code}")
    return response

# Configure CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory on startup
create_upload_dir()

# Global batch tracking

# Include routers
app.include_router(single.router)
app.include_router(batch.router)
app.include_router(export.router)

@app.get("/", include_in_schema=False)
async def root():
    # Redirects the root URL to the API documentation for user convenience.
    return RedirectResponse(url="/docs")

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
            },
            {
                "path": "/api/start-batch",
                "method": "POST",
                "description": "Start a new batch processing session.",
            },
            {
                "path": "/api/check-logo/batch/",
                "method": "POST",
                "description": "Validate multiple images for logos using a semicolon-separated list of paths/URLs.",
            },
            {
                "path": "/check-logo/batch/getCount",
                "method": "GET",
                "description": "Get the count of valid and invalid logos from the most recent batch process.",
            },
            {
                "path": "/api/check-logo/batch/export-csv",
                "method": "GET",
                "description": "Export the most recent batch processing results to a CSV file.",
            }
        ],
        "note": "For detailed request and response formats, please refer to the /docs endpoint."
    }