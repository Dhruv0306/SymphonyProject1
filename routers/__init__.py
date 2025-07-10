"""
Symphony Logo Detection API Routers Package

This package contains all the API routers used in the Symphony Logo Detection service.
Each router module handles a specific aspect of the API functionality, following
a clean separation of concerns.

Routers:
    - single: Endpoints for processing individual images
    - batch: Endpoints for processing multiple images in batches
    - batch_history: Endpoints for retrieving batch processing history
    - export: Endpoints for exporting processing results
    - admin_auth: Authentication endpoints for admin access
    - dashboard_stats: Endpoints for dashboard statistics
    - websocket: WebSocket endpoints for real-time updates

Each router is implemented as a FastAPI APIRouter and is included in the main
application through dependency injection in the App.py file.

Author: Symphony AI Team
Version: 1.0.0
"""
