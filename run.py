"""
FastAPI Application Server Runner

This script initializes and runs the FastAPI application using the uvicorn ASGI server.
It provides command-line argument parsing for host and port configuration and enables
auto-reloading for development purposes.

The server configuration includes:
- Host/port binding via command-line arguments
- Auto-reloading for rapid development
- Configurable watched paths for reload triggers
- Production-ready ASGI server (uvicorn)

Usage:
    python run.py                     # Run on localhost:8000
    python run.py --host 0.0.0.0      # Run on all network interfaces
    python run.py --port 9000         # Run on custom port

Author: Symphony AI Team
Version: 1.0.0
"""

import uvicorn
import argparse

if __name__ == "__main__":
    # Set up command line argument parsing for flexible server configuration
    parser = argparse.ArgumentParser(description="Run FastAPI application with Uvicorn")
    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="Host to run the server on (default: localhost)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to run the server on (default: 8000)",
    )

    args = parser.parse_args()

    # Configure and start the uvicorn ASGI server
    # - App.py:app specifies the path to the FastAPI application instance
    # - host/port are determined by command-line arguments
    # - reload=True enables auto-reloading for rapid development
    # - reload_includes specifies file patterns to watch for changes
    uvicorn.run(
        "App:app",
        host=args.host,
        port=args.port,
        reload=True,
        reload_includes=[
            "App.py",
            "routers/*.py",
            "utils/*.py",
            "services/*.py",
            "models/*.py",
        ],
    )
