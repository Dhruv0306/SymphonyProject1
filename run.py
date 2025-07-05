# run.py
import uvicorn
import argparse

if __name__ == "__main__":
    # Set up command line argument parsing
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
# This script runs the FastAPI application using Uvicorn.
# It specifies the host and port, and enables auto-reloading for development.
# The application is imported from the App module, which should contain the FastAPI app instance.
