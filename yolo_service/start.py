"""
YOLO Service Server Runner

This script initializes and runs the FastAPI-based YOLO detection service using the Uvicorn ASGI server.
It configures the server with command-line arguments and enables auto-reload for development.

The service provides logo detection capabilities through a RESTful API interface,
exposed on the configured host and port (default: localhost:8001).

Features:
    - Command-line configuration for host and port
    - Development mode with hot-reload capability
    - Isolated service for YOLO model execution
    - RESTful API interface to YOLO detection models

Usage:
    python start.py                     # Run on localhost:8001
    python start.py --host 0.0.0.0      # Run on all interfaces
    python start.py --port 9001         # Run on custom port

Author: Symphony AI Team
Version: 1.0.0
"""

import uvicorn
import argparse

if __name__ == "__main__":
    # Set up command line argument parser for flexible server configuration
    parser = argparse.ArgumentParser(description="Run FastAPI application server")
    parser.add_argument(
        "--host",
        default="localhost",
        help="Host interface to bind to (default: localhost)",
    )
    parser.add_argument(
        "--port", type=int, default=8001, help="Port to run server on (default: 8001)"
    )
    args = parser.parse_args()

    # Start the Uvicorn ASGI server with the FastAPI application
    # - main:app: Path to the FastAPI application instance
    # - host: Network interface to bind to (from command-line args)
    # - port: TCP port to listen on (from command-line args)
    # - reload: Enable auto-reload for development convenience
    uvicorn.run("main:app", host=args.host, port=args.port, reload=True)
