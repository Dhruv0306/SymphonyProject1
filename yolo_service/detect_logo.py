"""
Logo Detection Module using YOLOv8 and YOLOv11 Models

This module provides functionality to detect Symphony logos in images using multiple YOLO models.
It supports both local image files and URLs, and implements a multi-model approach for robust detection.

Key Features:
    - Multi-model ensemble detection using YOLOv8 and YOLOv11
    - Support for both local files and image URLs 
    - Robust error handling and logging
    - Configurable confidence thresholds
    - White boundary addition for edge case handling

Dependencies:
    - ultralytics
    - Pillow 
    - requests
    - pathlib
    - logging

Author: Symphony AI Team
Version: 1.0.0
"""

import sys
import os
import logging
from pathlib import Path
from PIL import Image, ImageOps
import requests
from io import BytesIO
from ultralytics import YOLO

# Configure logging with basic settings for tracking model performance and debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of trained model weights paths, ordered by preference
# Multiple models are used for ensemble-like predictions to improve accuracy
# Models are arranged in order of performance and reliability
MODEL_PATHS = [
    "../runs/detect/yolov8s_logo_detection/weights/best.pt",  # Primary YOLOv8s model - highest accuracy
    "../runs/detect/yolov8s_logo_detection2/weights/best.pt",  # Backup YOLOv8s with expanded dataset
    "../runs/detect/yolov8s_logo_detection3/weights/best.pt",  # YOLOv8s with focus on edge cases
    "../runs/detect/yolov11s_logo_detection/weights/best.pt",  # YOLOv11s for architectural diversity
    "../runs/detect/yolov11s3_logo_detection/weights/best.pt",  # Optimized YOLOv11s for speed
]

# Minimum confidence threshold for logo detection
# Current value of 0.35 provides optimal balance between precision and recall
# Increase for higher precision, decrease for higher recall
CONFIDENCE_THRESHOLD = 0.35


def add_boundary(img, boundary_size=10, color=(255, 255, 255)):
    """
    Add a white frame around the image to prevent edge-case detection issues.

    This function adds a border around the input image to improve detection reliability,
    particularly for logos that extend to image edges.

    Args:
        img (PIL.Image): Input image to be processed
        boundary_size (int, optional): Width of the boundary in pixels. Defaults to 10.
        color (tuple, optional): RGB color tuple for the boundary. Defaults to white (255, 255, 255).

    Returns:
        PIL.Image: Image with added boundary frame

    Example:
        >>> img = Image.open('logo.jpg')
        >>> framed_img = add_boundary(img, boundary_size=15)
    """
    return ImageOps.expand(img, border=boundary_size, fill=color)


def is_url(path):
    """
    Check if the given path is a valid HTTP/HTTPS URL.

    Validates input path string to determine if it represents a web URL.

    Args:
        path (str): Path or URL string to validate

    Returns:
        bool: True if path is a valid HTTP(S) URL, False otherwise

    Example:
        >>> is_url('https://example.com/image.jpg')
        True
        >>> is_url('local/path/image.jpg')
        False
    """
    return path.startswith("http://") or path.startswith("https://")


def load_models():
    """
    Load all available YOLO models from the MODEL_PATHS list.

    Attempts to load each model specified in MODEL_PATHS, handling errors gracefully
    and logging the status of each model load operation.

    Returns:
        list: List of tuples containing (model, path) pairs for successfully loaded models

    Note:
        - Models that fail to load are skipped with a warning
        - System exits if no models can be loaded
        - Each model is verified for file existence before loading

    Example:
        >>> models = load_models()
        >>> print(f"Loaded {len(models)} models successfully")
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


# Initialize models on module load for better performance
models = load_models()
if __name__ == "__main__":
    if not models:
        logger.error("No models loaded. Exiting.")
        sys.exit(1)


def check_logo(image_path):
    """
    Check for Symphony logo in the given image using multiple YOLO models.

    This is the main function that orchestrates the logo detection process using
    multiple YOLO models in an ensemble approach. It handles both local files and URLs,
    implements comprehensive error handling, and returns detailed detection results.

    Args:
        image_path (str): Local file path or URL of the image to analyze

    Returns:
        dict: Result dictionary containing:
            - Image_Path_or_URL (str): Original path/URL of the image
            - Is_Valid (str): "Valid" if logo detected, "Invalid" otherwise
            - Error (str, optional): Error message if any
            - Detected_By (str, optional): Name of model that detected the logo
            - Confidence (float, optional): Detection confidence score
            - Bounding_Box (dict, optional): Coordinates of detected logo

    Note:
        - Returns early if any model detects a logo with confidence > CONFIDENCE_THRESHOLD
        - Adds white boundary to images before processing
        - Implements comprehensive error handling and logging
        - Uses ensemble approach with multiple models for robust detection

    Example:
        >>> result = check_logo("path/to/image.jpg")
        >>> if result["Is_Valid"] == "Valid":
        >>>     print(f"Logo detected with {result['Confidence']} confidence")
    """
    try:
        logger.info(f"\nProcessing image: {image_path}")

        # Load image - handles both URLs and local files
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

        # Add boundary for improved edge detection
        img_with_boundary = add_boundary(img)

        # Run inference using each model in ensemble
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

        # Return invalid if no model detects the logo
        return {"Image_Path_or_URL": image_path, "Is_Valid": "Invalid"}

    except Exception as e:
        logger.error(f"Unexpected error processing image: {str(e)}\n")
        return {
            "Image_Path_or_URL": image_path,
            "Is_Valid": "Invalid",
            "Error": f"Unexpected error: {str(e)}",
        }


if __name__ == "__main__":
    # Test the logo detection with sample images
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
