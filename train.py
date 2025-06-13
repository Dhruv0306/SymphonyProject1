"""
YOLO Model Training Script

This script trains YOLOv8 and YOLOv11 models for logo detection.
The training uses pre-trained weights and custom dataset configuration.
"""

from ultralytics import YOLO

# YOLOv8s training configuration
# model = YOLO("yolov8s.pt")  # Load pre-trained YOLOv8s weights
# model.train(
#     data="./data/data.yaml",     # Dataset configuration file
#     epochs=150,                  # Number of training epochs
#     imgsz=640,                  # Input image size
#     batch=8,                    # Batch size
#     name="yolov8s_logo_detection",  # Run name for saving results
#     exist_ok=True               # Overwrite existing results
# )

# YOLOv11s training configuration
model = YOLO("yolo11s.pt")  # Load pre-trained YOLOv11s weights
model.train(
    data="./data/data.yaml",  # Dataset configuration file
    epochs=150,  # Number of training epochs
    imgsz=640,  # Input image size
    batch=2,  # Reduced batch size for YOLOv11
    name="yolov11s_logo_detection",  # Run name for saving results
    exist_ok=True,  # Overwrite existing results
)
