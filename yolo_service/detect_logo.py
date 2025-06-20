"""
Logo Detection Module using YOLOv8 and YOLOv11 Models

This module provides functionality to detect Symphony logos in images using multiple YOLO models.
It supports both local image files and URLs, and implements a multi-model approach for robust detection.
"""

import sys
import os
import logging
from pathlib import Path
from PIL import Image, ImageOps
import requests
from io import BytesIO
from ultralytics import YOLO

# Configure logging with basic settings
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of trained model weights paths, ordered by preference
# Multiple models are used for ensemble-like predictions to improve accuracy
MODEL_PATHS = [
    "../runs/detect/yolov8s_logo_detection/weights/best.pt",  # YOLOv8s model trained on logo dataset
    "../runs/detect/yolov8s_logo_detection2/weights/best.pt",  # Second iteration with additional data
    "../runs/detect/yolov8s_logo_detection3/weights/best.pt",  # Third iteration with refined data
    "../runs/detect/yolov11s_logo_detection/weights/best.pt",  # YOLOv11s model for comparison
    "../runs/detect/yolov11s3_logo_detection/weights/best.pt",  # YOLOv11s with optimized parameters
]

# Minimum confidence threshold for logo detection
# Adjust this value to balance between false positives and false negatives
CONFIDENCE_THRESHOLD = 0.35


def add_boundary(img, boundary_size=10, color=(255, 255, 255)):
    """
    Add a white frame around the image to prevent edge-case detection issues.

    Args:
        img (PIL.Image): Input image
        boundary_size (int): Width of the boundary in pixels
        color (tuple): RGB color tuple for the boundary

    Returns:
        PIL.Image: Image with added boundary
    """
    return ImageOps.expand(img, border=boundary_size, fill=color)


def is_url(path):
    """
    Check if the given path is a valid HTTP/HTTPS URL.

    Args:
        path (str): Path or URL to check

    Returns:
        bool: True if path is a URL, False otherwise
    """
    return path.startswith("http://") or path.startswith("https://")


def load_models():
    """
    Load all available YOLO models from the MODEL_PATHS list.

    Returns:
        list: List of tuples containing (model, path) pairs for successfully loaded models

    Note:
        - Models that fail to load are skipped with a warning
        - System exits if no models can be loaded
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


# Initialize models on module load
models = load_models()
if __name__ == "__main__":
    if not models:
        logger.error("No models loaded. Exiting.")
        sys.exit(1)


def check_logo(image_path):
    """
    Check for Symphony logo in the given image using multiple YOLO models.

    Args:
        image_path (str): Local file path or URL of the image to check

    Returns:
        dict: Result dictionary containing:
            - Image Path/URL: Original path/URL of the image
            - Is Valid: "Valid" if logo detected, "Invalid" otherwise
            - Error: Error message if any (optional)
            - Detected By: Name of model that detected the logo (if valid)

    Note:
        - Returns early if any model detects a logo
        - Adds white boundary to images before processing
        - Handles both local files and URLs
        - Implements robust error handling
    """
    try:
        logger.info(f"\nProcessing image: {image_path}")

        # Load image
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

        # Add boundary
        img_with_boundary = add_boundary(img)

        # Run inference on each model
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

        # If no model detects symphony
        return {"Image_Path_or_URL": image_path, "Is_Valid": "Invalid"}

    except Exception as e:
        logger.error(f"Unexpected error processing image: {str(e)}\n")
        return {
            "Image_Path_or_URL": image_path,
            "Is_Valid": "Invalid",
            "Error": f"Unexpected error: {str(e)}",
        }


if __name__ == "__main__":
    # Test the logo detection
    test_images = [
        "test/Image_01_Yes.jpg",
        "test/Image_02_Yes.jpg",
        "test/Image_07_Yes.jpg",
        "test/Image_08_Yes.jpg",
        "test/Image_03_No.jpg",
        "test/Image_04_No.jpg",
    ]

    for image in test_images:
        result = check_logo(image)
        print(f"Testing {image}: {result}")
