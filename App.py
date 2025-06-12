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
from utils.cleanup import cleanup_old_batches, cleanup_temp_uploads, log_cleanup_stats
from routers import single, batch, export
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

# Setup logging
logger = setup_logging()

# Initialize FastAPI application
app = FastAPI(
    title="Symphony Logo Detection API",
    description="API service for detecting Symphony logos in images using YOLO models",
    version="1.0.0"
)

# Initialize scheduler
scheduler = AsyncIOScheduler()

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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize application resources and start scheduled tasks"""
    try:
        print("\nStarting application initialization...")
        
        # Create upload directory
        print("Creating upload directory...")
        create_upload_dir()
        
        # Perform initial cleanup on startup
        print("Starting initial cleanup process...")
        logger.info("Performing initial cleanup on startup...")
        batch_cleaned = cleanup_old_batches(max_age_hours=24)
        temp_cleaned = cleanup_temp_uploads(max_age_minutes=30)
        log_cleanup_stats(batch_cleaned, temp_cleaned)
        print(f"Initial cleanup summary: {batch_cleaned} batches and {temp_cleaned} temp files removed")
        logger.info(f"Initial cleanup completed: {batch_cleaned} batches and {temp_cleaned} temp files removed")

        # Initialize and start the scheduler
        print("Initializing scheduler...")
        scheduler = AsyncIOScheduler()
        
        # Add cleanup jobs
        scheduler.add_job(cleanup_old_batches, 'interval', hours=1, args=[24])
        scheduler.add_job(cleanup_temp_uploads, 'interval', minutes=30, args=[30])
        
        # Start the scheduler
        scheduler.start()
        print("Scheduler started successfully")
        logger.info("Scheduler started successfully")
        
    except Exception as e:
        error_msg = f"Error during startup: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on application shutdown"""
    print("\n[DEBUG] Starting application shutdown...")
    scheduler.shutdown()
    print("[DEBUG] Cleanup scheduler stopped")
    logger.info("Cleanup scheduler stopped")
    print("[DEBUG] Application shutdown complete")

async def cleanup_task():
    """Run both cleanup operations and log results"""
    print("\n[DEBUG] Running scheduled cleanup task...")
    batch_cleaned = cleanup_old_batches(max_age_hours=24)
    temp_cleaned = cleanup_temp_uploads(max_age_minutes=30)
    log_cleanup_stats(batch_cleaned, temp_cleaned)
    print("[DEBUG] Scheduled cleanup task complete")

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