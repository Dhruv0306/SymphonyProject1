"""
Logo Detection Module using YOLOv8 and YOLOv11 Models

This module provides functionality to detect Symphony logos in images using multiple YOLO models.
It supports both local image files and URLs, and implements a multi-model approach for robust detection.

The module uses an ensemble of YOLOv8 and YOLOv11 models to achieve high accuracy logo detection.
It handles both local image files and remote URLs, and includes robust error handling and logging.

Key Features:
- Multi-model ensemble detection
- Support for local files and URLs 
- White boundary addition for edge case handling
- Detailed logging and error reporting
- Configurable confidence thresholds
"""

import sys
import os
import logging
from pathlib import Path
from PIL import Image
import numpy as np
import requests
from io import BytesIO
from ultralytics import YOLO

# Configure logging with basic settings for tracking model operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of trained model weights paths, ordered by preference
# Multiple models are used for ensemble-like predictions to improve accuracy
# Models are loaded in order, with later models serving as backups
MODEL_PATHS = [
    "runs/detect/yolov8s_logo_detection/weights/best.pt",  # Primary YOLOv8s model
    "runs/detect/yolov8s_logo_detection2/weights/best.pt",  # Enhanced YOLOv8s with more data
    "runs/detect/yolov8s_logo_detection3/weights/best.pt",  # Further refined YOLOv8s
    "runs/detect/yolov11s_logo_detection/weights/best.pt",  # Complementary YOLOv11s model
    "runs/detect/yolov11s3_logo_detection/weights/best.pt",  # Optimized YOLOv11s variant
]

# Confidence threshold for accepting detections
# Higher values reduce false positives but may increase false negatives
CONFIDENCE_THRESHOLD = 0.35


def add_boundary(img, boundary_size=10, color=(255, 255, 255)):
    """
    Add a white frame around the image to prevent edge-case detection issues.

    This function adds a border around the input image to improve detection reliability,
    particularly for logos that extend to image edges.

    Args:
        img (PIL.Image): Input image to process
        boundary_size (int, optional): Width of the boundary in pixels. Defaults to 10.
        color (tuple, optional): RGB color tuple for boundary. Defaults to white (255,255,255).

    Returns:
        PIL.Image: Image with added boundary frame

    Example:
        >>> img = Image.open('logo.jpg')
        >>> framed_img = add_boundary(img, boundary_size=15)
    """
    arr = np.array(img)
    h, w, c = arr.shape
    padded = (
        np.ones((h + 2 * boundary_size, w + 2 * boundary_size, c), dtype=np.uint8) * 255
    )
    padded[boundary_size : boundary_size + h, boundary_size : boundary_size + w, :] = (
        arr
    )
    return Image.fromarray(padded)


def is_url(path):
    """
    Check if the given path is a valid HTTP/HTTPS URL.

    Validates if input string starts with http:// or https:// to identify URLs.

    Args:
        path (str): Path or URL string to validate

    Returns:
        bool: True if path is a URL, False if local path

    Example:
        >>> is_url('https://example.com/image.jpg')
        True
        >>> is_url('/local/path/image.jpg')
        False
    """
    return path.startswith("http://") or path.startswith("https://")


def load_models():
    """
    Load all available YOLO models from the MODEL_PATHS list.

    Attempts to load each model in MODEL_PATHS, handling failures gracefully.
    Skips missing or invalid model files with appropriate warnings.

    Returns:
        list: List of tuples containing (model, path) pairs for successfully loaded models

    Note:
        - Models that fail to load are skipped with a warning
        - System exits if no models can be loaded
        - Models are loaded in order of MODEL_PATHS preference

    Example:
        >>> models = load_models()
        >>> if models:
        >>>     first_model = models[0][0]
    """
    loaded_models = []
    for path in MODEL_PATHS:
        try:
            if not os.path.exists(path):
                logger.warning(f"Model file not found at {path}")
                continue
            logger.info(f"Loading model from {path}")
            model = YOLO(path)
            loaded_models.append((model, path))
            logger.info(f"Model loaded successfully: {path}")
        except Exception as e:
            logger.error(f"Error loading model from {path}: {str(e)}")
    return loaded_models


# Initialize model ensemble on module load
models = load_models()
if __name__ == "__main__":
    if not models:
        logger.error("No models loaded. Exiting.")
        sys.exit(1)


def check_logo(image_path):
    """
    Check for Symphony logo in the given image using multiple YOLO models.

    This is the main detection function that processes an image through the model
    ensemble to detect Symphony logos. It handles both local files and URLs,
    and implements comprehensive error handling.

    Args:
        image_path (str): Local file path or URL of the image to analyze

    Returns:
        dict: Detection result containing:
            - Image_Path_or_URL (str): Original image location
            - Is_Valid (str): "Valid" if logo detected, "Invalid" otherwise
            - Error (str, optional): Error message if processing failed
            - Detected_By (str, optional): Name of model that detected the logo
            - Confidence (float, optional): Detection confidence score
            - Bounding_Box (dict, optional): Logo location coordinates

    Note:
        - Returns early if any model detects a logo with sufficient confidence
        - Adds white boundary to images before processing
        - Handles both local files and URLs
        - Implements robust error handling and logging

    Example:
        >>> result = check_logo("test/logo_image.jpg")
        >>> if result["Is_Valid"] == "Valid":
        >>>     print(f"Logo detected by {result['Detected_By']}")
    """
    try:
        logger.info(f"\nProcessing image: {image_path}")

        # Load and validate image from URL or local path
        if is_url(image_path):
            try:
                logger.info(f"Downloading image from URL: {image_path}\n")
                response = requests.get(image_path)
                response.raise_for_status()
                img = Image.open(BytesIO(response.content)).convert("RGB")
                logger.info("Image downloaded and opened successfully\n")
            except Exception as e:
                logger.error(f"Failed to load image from URL: {str(e)}\n")
                return {
                    "Image_Path_or_URL": image_path,
                    "Is_Valid": "Invalid",
                    "Error": f"Failed to load URL: {str(e)}",
                }
        else:
            if not os.path.exists(image_path):
                logger.error(f"Image file not found: {image_path}\n")
                return {
                    "Image_Path_or_URL": image_path,
                    "Is_Valid": "Invalid",
                    "Error": "File not found",
                }
            try:
                img = Image.open(image_path).convert("RGB")
                logger.info("Local image opened successfully\n")
            except Exception as e:
                logger.error(f"Failed to open local image: {str(e)}\n")
                return {
                    "Image_Path_or_URL": image_path,
                    "Is_Valid": "Invalid",
                    "Error": f"Failed to open image: {str(e)}",
                }

        # Add protective boundary for edge case handling
        img_with_boundary = add_boundary(img)

        # Process image through model ensemble
        for model, model_path in models:
            try:
                logger.info(f"Running model inference: {model_path}")
                results = model.predict(img_with_boundary, conf=CONFIDENCE_THRESHOLD)
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        name = model.names[cls_id]
                        logger.info(f"Detected class: {name}")
                        if name.lower() == "symphony":
                            logger.info("Valid logo detected, returning early.\n")
                            box_coords = box.xyxy[0].tolist()
                            return {
                                "Image_Path_or_URL": image_path,
                                "Is_Valid": "Valid",
                                "Confidence": float(box.conf[0]),
                                "Detected_By": Path(model_path).parts[-3],
                                "Bounding_Box": {
                                    "x1": int(box_coords[0]),
                                    "y1": int(box_coords[1]),
                                    "x2": int(box_coords[2]),
                                    "y2": int(box_coords[3]),
                                },
                            }
            except Exception as e:
                logger.error(f"Inference error with model {model_path}: {str(e)}\n")
                continue

        # Return invalid if no model detects logo
        return {"Image_Path_or_URL": image_path, "Is_Valid": "Invalid"}

    except Exception as e:
        logger.error(f"Unexpected error processing image: {str(e)}\n")
        return {
            "Image_Path_or_URL": image_path,
            "Is_Valid": "Invalid",
            "Error": f"Unexpected error: {str(e)}",
        }


if __name__ == "__main__":
    # Test the logo detection system with sample images
    test_images = [
        "test/Image_01_Yes.jpg",  # Known positive sample
        "test/Image_02_Yes.jpg",  # Known positive sample
        "test/Image_07_Yes.jpg",  # Known positive sample
        "test/Image_08_Yes.jpg",  # Known positive sample
        "test/Image_03_No.jpg",  # Known negative sample
        "test/Image_04_No.jpg",  # Known negative sample
    ]

    for image in test_images:
        result = check_logo(image)
        print(f"Testing {image}: {result}")
