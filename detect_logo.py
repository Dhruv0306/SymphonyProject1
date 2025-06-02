import sys
import os
import logging
from pathlib import Path
from PIL import Image, ImageOps
import requests
from io import BytesIO
from ultralytics import YOLO

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths to the trained YOLO model weights
MODEL_PATHS = [
    'runs/detect/yolov8s_logo_detection/weights/best.pt',
    'runs/detect/yolov8s_logo_detection2/weights/best.pt',
    'runs/detect/yolov8s_logo_detection3/weights/best.pt',
    'runs/detect/yolov11s_logo_detection/weights/best.pt',
]

# Confidence threshold
CONFIDENCE_THRESHOLD = 0.35

def add_boundary(img, boundary_size=10, color=(255, 255, 255)):
    """Add a frame (boundary) of specified size and color around the PIL image."""
    return ImageOps.expand(img, border=boundary_size, fill=color)

def is_url(path):
    """Check if the given path is a URL"""
    return path.startswith('http://') or path.startswith('https://')

def load_models():
    """Load all YOLO models and pair each with its path."""
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

# Load models on initialization
models = load_models()
if not models:
    logger.error("No models loaded. Exiting.")
    sys.exit(1)

def check_logo(image_path):
    """
    Check for Symphony logo in the given image using multiple YOLO models.
    Returns early if any model detects it.
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
                return {"Image Path/URL": image_path, "Is Valid": "Invalid", "Error": f"Failed to load URL: {str(e)}"}
        else:
            if not os.path.exists(image_path):
                logger.error(f"Image file not found: {image_path}\n")
                return {"Image Path/URL": image_path, "Is Valid": "Invalid", "Error": "File not found"}
            try:
                img = Image.open(image_path).convert("RGB")
                logger.info("Local image opened successfully\n")
            except Exception as e:
                logger.error(f"Failed to open local image: {str(e)}\n")
                return {"Image Path/URL": image_path, "Is Valid": "Invalid", "Error": f"Failed to open image: {str(e)}"}

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
                        if name.lower() == 'symphony':
                            logger.info("Valid logo detected, returning early.\n")
                            return {
                                "Image Path/URL": image_path,
                                "Is Valid": "Valid",
                                "Detected By": Path(model_path).parts[-3]  # Folder name of the model
                            }
            except Exception as e:
                logger.error(f"Inference error with model {model_path}: {str(e)}\n")
                continue

        # If no model detects symphony
        return {
            "Image Path/URL": image_path,
            "Is Valid": "Invalid"
        }

    except Exception as e:
        logger.error(f"Unexpected error processing image: {str(e)}\n")
        return {
            "Image Path/URL": image_path,
            "Is Valid": "Invalid",
            "Error": f"Unexpected error: {str(e)}"
        }

if __name__ == "__main__":
    # Test the logo detection
    test_images = [
        'test/Image_01_Yes.jpg',
        'test/Image_02_Yes.jpg',
        'test/Image_07_Yes.jpg',
        'test/Image_08_Yes.jpg',
        'test/Image_03_No.jpg',
        'test/Image_04_No.jpg'
    ]

    for image in test_images:
        result = check_logo(image)
        print(f"Testing {image}: {result}")
