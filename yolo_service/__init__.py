"""
Symphony YOLO Logo Detection Service Package

This package implements a standalone microservice for Symphony logo detection
using YOLO models. It provides a REST API that can be consumed by the main
application or other services.

Modules:
    - main: FastAPI application implementing the REST API endpoints
    - detect_logo: Core logo detection functionality using YOLO models
    - start: Server startup script with configuration

The service is designed to be deployable as an independent container and
communicates with the main application via HTTP/REST.

Models:
    - YOLOv8s: Primary model for logo detection
    - YOLOv11s: Secondary model for improved accuracy

Author: Symphony AI Team
Version: 1.0.0
"""
