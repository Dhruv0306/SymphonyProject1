"""
FastAPI Application for Logo Detection Service

This module initializes the FastAPI application and registers the API routers.
It provides endpoints for logo detection in images using YOLO models, batch processing,
and administrative functions.

Key Features:
- Single and batch image logo detection
- Real-time WebSocket progress updates
- Automated cleanup of temporary files
- Rate limiting and CORS protection
- Administrative dashboard
"""

# Standard library imports
import glob
import logging
import asyncio
import os
import sys
import json
from contextlib import asynccontextmanager

# Third-party imports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Local application imports
from utils.logger import setup_logging
from utils.file_ops import create_upload_dir
from utils.cleanup import (
    cleanup_old_batches,
    cleanup_old_pending_batches,
    cleanup_temp_uploads,
    log_cleanup_stats,
)
from utils.ws_manager import connection_manager
from utils.security import csrf_protection
from utils.background_tasks import process_with_chunks

# Import admin_auth first to avoid circular imports
from routers import admin_auth
from routers import (
    single,
    batch,
    export,
    batch_history,
    dashboard_stats,
    dashboard_stats,
    websocket,
)

# Initialize logging
logger = setup_logging()

# YOLO service URL is now set by run_symphony.py
# This code is kept for backward compatibility when running directly
if "--host" in sys.argv and "--port" in sys.argv:
    host_index = sys.argv.index("--host")
    port_index = sys.argv.index("--port")
    if host_index + 1 < len(sys.argv) and port_index + 1 < len(sys.argv):
        host = sys.argv[host_index + 1]
        port = int(sys.argv[port_index + 1])
        yolo_port = port + 1
        os.environ["YOLO_SERVICE_URL"] = f"http://{host}:{yolo_port}"
        logger.info(
            f"Setting YOLO_SERVICE_URL to http://{host}:{yolo_port} based on command line arguments"
        )


@asynccontextmanager
async def lifespan(app):
    # --- Startup logic ---
    try:
        print("\nStarting application initialization...")
        create_upload_dir()
        print("Creating upload directory...")
        print("Starting initial cleanup process...")
        logger.info("Performing initial cleanup on startup...")
        batch_cleaned = cleanup_old_batches(max_age_hours=24)
        temp_cleaned = cleanup_temp_uploads(max_age_minutes=30)
        pending_cleaned = cleanup_old_pending_batches(max_age_hours=72)  # 3 days
        log_cleanup_stats(batch_cleaned, temp_cleaned, pending_cleaned)
        print(
            f"Initial cleanup summary: {batch_cleaned} batches, {temp_cleaned} temp files, {pending_cleaned} pending batches removed"
        )
        logger.info(
            f"Initial cleanup completed: {batch_cleaned} batches, {temp_cleaned} temp files, {pending_cleaned} pending batches removed"
        )
        print("Initializing scheduler...")
        app.state.scheduler = AsyncIOScheduler()
        app.state.scheduler.add_job(cleanup_old_batches, "interval", hours=1, args=[24])
        app.state.scheduler.add_job(
            cleanup_temp_uploads, "interval", minutes=30, args=[30]
        )
        app.state.scheduler.add_job(
            cleanup_old_pending_batches, "interval", hours=24, args=[72]
        )  # Daily cleanup of very old pending batches
        app.state.scheduler.add_job(
            csrf_protection.clean_expired_tokens, "interval", minutes=15
        )
        app.state.scheduler.add_job(
            connection_manager.cleanup_recovery_info, "interval", hours=6
        )
        app.state.scheduler.start()
        print("Scheduler started successfully")
        logger.info("Scheduler started successfully")

        async def recover_incomplete_url_batches():
            """Recover and resume URL batches from pending_urls.json files."""
            for pending_path in glob.glob("exports/*/pending_urls.json"):
                try:
                    with open(pending_path) as f:
                        data = json.load(f)

                    batch_id = data["batch_id"]
                    client_id = data["client_id"]
                    chunk_size = data["chunk_size"]
                    image_urls = data["image_urls"]
                    processed = data.get("processed", 0)
                    total = data.get("total", len(image_urls))
                    valid = data.get("valid", 0)
                    invalid = data.get("invalid", 0)

                    from utils.batch_tracker import re_init_batch

                    re_init_batch(
                        batch_id=batch_id,
                        processed=processed,
                        total=total,
                        valid=valid,
                        invalid=invalid,
                    )
                    print(
                        f"[Recovery] Resuming batch {batch_id} with {len(image_urls)} URLs"
                    )
                    logger.info(
                        f"Recovering batch {batch_id} with {len(image_urls)} URLs"
                    )

                    await process_with_chunks(
                        batch_id=batch_id,
                        client_id=client_id,
                        chunk_size=chunk_size,
                        image_urls=image_urls,
                    )

                    print(f"[Recovery] Batch {batch_id} resumed successfully")
                    logger.info(
                        f"Recovered batch {batch_id} with {len(image_urls)} URLs"
                    )
                except Exception as e:
                    print(f"[Recovery Error] {pending_path} → {e}")
                    logger.error(
                        f"Error recovering batch from {pending_path}: {str(e)}"
                    )

        async def recover_incomplete_file_batches():
            """Recover and resume file batches from pending_files.json files."""
            for pending_path in glob.glob("exports/*/pending_files.json"):
                try:
                    with open(pending_path) as f:
                        data = json.load(f)

                    batch_id = data["batch_id"]
                    client_id = data["client_id"]
                    chunk_size = data["chunk_size"]
                    files_name = data["files_names"]
                    processed = data.get("processed", 0)
                    total = data.get("total", len(files_name))
                    valid = data.get("valid", 0)
                    invalid = data.get("invalid", 0)

                    from utils.batch_tracker import re_init_batch

                    re_init_batch(
                        batch_id=batch_id,
                        processed=processed,
                        total=total,
                        valid=valid,
                        invalid=invalid,
                    )
                    print(
                        f"[Recovery] Resuming batch {batch_id} with {len(files_name)} files"
                    )
                    logger.info(
                        f"Recovering batch {batch_id} with {len(files_name)} files"
                    )

                    files_data = []
                    pending_files_dir = os.path.join(
                        "exports", batch_id, "pending_files"
                    )
                    for file_name in files_name:
                        file_path = os.path.join(pending_files_dir, file_name)
                        if os.path.exists(file_path):
                            with open(file_path, "rb") as file:
                                files_data.append((file_name, file.read()))
                        else:
                            logger.warning(
                                f"File {file_name} not found in pending files directory"
                            )
                    await process_with_chunks(
                        batch_id=batch_id,
                        client_id=client_id,
                        chunk_size=chunk_size,
                        files_data=files_data,
                    )

                    print(f"[Recovery] Batch {batch_id} resumed successfully")
                    logger.info(
                        f"Recovered batch {batch_id} with {len(files_data)} files"
                    )
                except Exception as e:
                    print(f"[Recovery Error] {pending_path} → {e}")
                    logger.error(
                        f"Error recovering batch from {pending_path}: {str(e)}"
                    )

        async def monitor_websockets():
            """Periodically check and remove stale WebSocket connections"""
            while True:
                connection_manager.prune_stale_connections()
                await asyncio.sleep(30)

        app.state.monitor_ws_task = asyncio.create_task(monitor_websockets())
        app.state.recover_url_task = asyncio.create_task(
            recover_incomplete_url_batches()
        )
        app.state.recover_file_task = asyncio.create_task(
            recover_incomplete_file_batches()
        )
    except Exception as e:
        error_msg = f"Error during startup: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise
    # --- Yield to run app ---
    yield
    # --- Shutdown logic ---
    try:
        print("\n[DEBUG] Starting application shutdown...")
        if hasattr(app.state, "scheduler"):
            app.state.scheduler.shutdown()
            print("[DEBUG] Cleanup scheduler stopped")
            logger.info("Cleanup scheduler stopped")
        if hasattr(app.state, "monitor_ws_task"):
            app.state.monitor_ws_task.cancel()
            print("[DEBUG] WebSocket monitor task cancelled")
            logger.info("WebSocket monitor task cancelled")
        if hasattr(app.state, "recover_url_task"):
            app.state.recover_url_task.cancel()
            print("[DEBUG] URL Recovery task cancelled")
            logger.info("URL Recovery task cancelled")
        if hasattr(app.state, "recover_file_task"):
            app.state.recover_file_task.cancel()
            print("[DEBUG] File Recovery task cancelled")
            logger.info("File Recovery task cancelled")
        print("[DEBUG] Application shutdown complete")
    except Exception as e:
        error_msg = f"Error during shutdown: {str(e)}"
        print(error_msg)
        logger.error(error_msg)


# Initialize FastAPI application with metadata
app = FastAPI(
    title="Symphony Logo Detection API",
    description="API service for detecting Symphony logos in images using YOLO models",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure rate limiting to prevent abuse
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware to log all HTTP requests and responses.

    Args:
        request: The incoming HTTP request
        call_next: The next middleware handler

    Returns:
        The HTTP response
    """
    logger.info(f"Request: {request.method} {request.url}")

    # Log cookies for admin endpoints for debugging
    if "/api/admin/" in str(request.url):
        logger.info(f"Request cookies: {request.cookies}")

    response = await call_next(request)

    logger.info(
        f"Response: {request.method} {request.url} - Status: {response.status_code}"
    )

    return response


# Configure CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    # Use dynamic origins to support any host/port combination
    allow_origins=["*"],  # In production, you should restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-CSRF-Token",
        "Content-Type",
        "Content-Disposition",
        "X-Total-Count",
    ],
)


async def cleanup_task():
    """
    Executes periodic cleanup of temporary files and batch processing results.
    Logs statistics about removed files.
    """
    print("\n[DEBUG] Running scheduled cleanup task...")
    batch_cleaned = cleanup_old_batches(max_age_hours=24)
    temp_cleaned = cleanup_temp_uploads(max_age_minutes=30)
    log_cleanup_stats(batch_cleaned, temp_cleaned)
    print("[DEBUG] Scheduled cleanup task complete")


@app.websocket("/ws/batch/{batch_id}")
async def websocket_endpoint(websocket: WebSocket, batch_id: str):
    """
    WebSocket endpoint for real-time batch processing updates with ping/pong and timeout.
    """
    await connection_manager.connect(batch_id, websocket)

    # Track last activity for timeout (10 minutes)
    last_activity = asyncio.get_event_loop().time()
    timeout_seconds = 600  # 10 minutes

    async def send_ping():
        """Send ping to keep connection alive"""
        try:
            await websocket.send_json(
                {"type": "ping", "timestamp": asyncio.get_event_loop().time()}
            )
            return True
        except:
            return False

    async def handle_timeout():
        """Handle connection timeout"""
        nonlocal last_activity
        while True:
            await asyncio.sleep(30)  # Check every 30 seconds
            current_time = asyncio.get_event_loop().time()
            if current_time - last_activity > timeout_seconds:
                logger.info(f"WebSocket timeout for batch {batch_id}")
                await websocket.close(code=1000, reason="Timeout due to inactivity")
                break

    # Start timeout handler
    timeout_task = asyncio.create_task(handle_timeout())

    try:
        while True:
            try:
                # Wait for message with timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                last_activity = asyncio.get_event_loop().time()

                # Handle pong responses
                try:
                    message = json.loads(data)
                    if message.get("type") == "pong":
                        logger.debug(f"Pong received from batch {batch_id}")
                        continue
                except json.JSONDecodeError:
                    pass

            except asyncio.TimeoutError:
                # Send ping on timeout
                if not await send_ping():
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for batch {batch_id}")
    except Exception as e:
        logger.error(f"WebSocket error for batch {batch_id}: {str(e)}")
    finally:
        timeout_task.cancel()
        connection_manager.disconnect(batch_id, websocket)


# Register API routers
app.include_router(single.router)
app.include_router(batch.router)
app.include_router(export.router)
app.include_router(admin_auth.router)
app.include_router(batch_history.router)
app.include_router(dashboard_stats.router)
app.include_router(websocket.router)


@app.get("/", include_in_schema=False)
async def root():
    """Redirects root URL to API documentation"""
    return RedirectResponse(url="/docs")


@app.get("/api")
async def api_explanation():
    """
    Provides a comprehensive summary of available API endpoints and their usage.
    Returns a dictionary containing endpoint descriptions and usage information.
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
            },
            {
                "path": "/api/admin/login",
                "method": "POST",
                "description": "Admin login endpoint for secure dashboard access.",
            },
            {
                "path": "/api/admin/batch-history",
                "method": "GET",
                "description": "Get history of all processed batches (admin only).",
            },
            {
                "path": "/ws/batch/{batch_id}",
                "method": "WebSocket",
                "description": "WebSocket endpoint for real-time batch processing updates.",
            },
        ],
        "note": "For detailed request and response formats, please refer to the /docs endpoint.",
    }
