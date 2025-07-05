"""
FastAPI Application Runner

This script initializes and runs a FastAPI application using uvicorn server.
It configures the server to run on all network interfaces (0.0.0.0) on port 8001
with hot reload enabled for development.
"""

import uvicorn
import argparse

if __name__ == "__main__":
    # Set up command line argument parser
    parser = argparse.ArgumentParser(description="Run FastAPI application server")
    parser.add_argument("--host", default="localhost", help="Host interface to bind to")
    parser.add_argument("--port", type=int, default=8001, help="Port to run server on")
    args = parser.parse_args()

    # Run the FastAPI application using uvicorn server
    # Parameters:
    # - main:app: Path to the FastAPI application instance
    # - host: Bind socket to specified host interface (default: localhost)
    # - port: Run server on specified port (default: 8001)
    # - reload: Enable auto-reload on code changes (development mode)
    uvicorn.run("main:app", host=args.host, port=args.port, reload=True)
