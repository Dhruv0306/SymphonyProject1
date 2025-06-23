"""
FastAPI Application Runner

This script initializes and runs a FastAPI application using uvicorn server.
It configures the server to run on all network interfaces (0.0.0.0) on port 8001
with hot reload enabled for development.
"""

import uvicorn

if __name__ == "__main__":
    # Run the FastAPI application using uvicorn server
    # Parameters:
    # - main:app: Path to the FastAPI application instance
    # - host: Bind socket to all network interfaces (0.0.0.0)
    # - port: Run server on port 8001
    # - reload: Enable auto-reload on code changes (development mode)
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
