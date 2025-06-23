"""
YOLO Model Training Script

This script trains YOLOv8 and YOLOv11 models for logo detection.
The training uses pre-trained weights and custom dataset configuration.

Models:
    - YOLOv8s: Standard YOLOv8 model with batch size 8
    - YOLOv11s: Latest YOLO version with reduced batch size for better stability

Configuration:
    - Dataset: Custom logo detection dataset defined in data.yaml
    - Image size: 640x640 pixels
    - Training epochs: 150
    - Batch sizes: 8 for YOLOv8s, 2 for YOLOv11s
    
Returns:
    Trained model weights and training metrics saved to runs/train/
"""

from ultralytics import YOLO

# YOLOv8s training configuration
# Initialize YOLOv8s model with pre-trained weights for transfer learning
# model = YOLO("yolov8s.pt")  # Load pre-trained YOLOv8s weights
# model.train(
#     data="./data/data.yaml",     # Path to dataset configuration YAML
#     epochs=150,                  # Total number of training epochs
#     imgsz=640,                  # Input image resolution
#     batch=8,                    # Number of images per batch
#     name="yolov8s_logo_detection",  # Unique identifier for this training run
#     exist_ok=True               # Allow overwriting existing training results
# )

# YOLOv11s training configuration
# Initialize YOLOv11s model with latest architecture and pre-trained weights
model = YOLO("yolo11s.pt")  # Load pre-trained YOLOv11s model
model.train(
    data="./data/data.yaml",  # Path to dataset configuration YAML
    epochs=150,  # Total training epochs for convergence
    imgsz=640,  # Standard YOLO input resolution
    batch=2,  # Smaller batch size to prevent memory issues
    name="yolov11s_logo_detection",  # Unique run identifier
    exist_ok=True,  # Allow overwriting previous results
)
