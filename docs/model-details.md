# YOLO Model Architecture

The Symphony Logo Detection System employs a cascade of six specialized YOLO (You Only Look Once) models for accurate logo detection. This document details the model architecture, processing pipeline, and implementation.

## Model Overview

The system leverages both YOLOv8 and YOLOv11 models in a sequential processing pipeline, with early exit optimization for performance:

1. `yolov8s_logo_detection` - Primary YOLOv8s model
2. `yolov8s_logo_detection2` - Enhanced YOLOv8s with additional training data
3. `yolov8s_logo_detection3` - Refined YOLOv8s with optimized parameters
4. `yolov11s_logo_detection` - Advanced YOLOv11s model
5. `yolov11s3_logo_detection` - Optimized YOLOv11s variant
6. `yolov11s_cooler_detection` - YOLOv11s model trained on cooler dataset

## Detection Pipeline

The detection pipeline processes images sequentially through the models until a logo is detected or all models have been tried:

```python
def check_logo(image_path_or_file):
    """
    Process image through cascade of models with early exit on detection.
    
    Args:
        image_path_or_file: Path to image or file-like object
        
    Returns:
        dict: Detection results with validation status, confidence, and metadata
    """
    # Process image through preprocessing pipeline
    try:
        # Load and preprocess image with white boundary addition
        image = preprocess_image(image_path_or_file)
        
        # Sequential model testing with early exit
        for i, model_path in enumerate(MODEL_PATHS):
            model = load_model(model_path)
            results = model.predict(image, conf=CONFIDENCE_THRESHOLD)
            
            # Check if any detection exceeds confidence threshold
            if results and results[0].boxes.conf.numel() > 0 and results[0].boxes.conf.max() >= CONFIDENCE_THRESHOLD:
                # Logo detected - return results and exit early
                bbox = extract_bbox(results[0])
                model_name = os.path.basename(os.path.dirname(model_path))
                return {
                    "image_path": str(image_path_or_file),
                    "is_valid": "Valid",
                    "confidence": float(results[0].boxes.conf.max()),
                    "detected_by": model_name,
                    "bbox": bbox,
                    "error": None
                }
        
        # No detection from any model
        return {
            "image_path": str(image_path_or_file),
            "is_valid": "Invalid",
            "confidence": None,
            "detected_by": None,
            "bbox": None,
            "error": None
        }
    except Exception as e:
        # Error handling
        return {
            "image_path": str(image_path_or_file),
            "is_valid": "Invalid",
            "confidence": None,
            "detected_by": None,
            "bbox": None,
            "error": str(e)
        }
```

## Image Preprocessing

Each image undergoes preprocessing before being fed to the models:

```python
def preprocess_image(image_source):
    """
    Preprocess image before model inference.
    
    Args:
        image_source: Image path, URL, or file-like object
        
    Returns:
        PIL.Image: Processed image ready for model inference
    """
    # Load image from different sources (file, URL)
    if isinstance(image_source, str):
        if image_source.startswith(('http://', 'https://')):
            response = requests.get(image_source, timeout=10)
            image = Image.open(BytesIO(response.content))
        else:
            image = Image.open(image_source)
    else:
        # File-like object (UploadFile)
        image = Image.open(image_source.file)
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Add white boundary for better detection
    image = ImageOps.expand(image, border=10, fill='white')
    
    return image
```

## Model Architecture Details

### YOLOv8s Models

The YOLOv8s models (variants 1, 2, and 3) are based on the YOLOv8 small architecture with the following characteristics:

- **Backbone:** Modified CSPDarknet with C3 modules
- **Neck:** FPN + PAN architecture for feature fusion
- **Head:** Decoupled detection heads
- **Input Size:** 640×640 pixels
- **Parameters:** Approximately 11.2 million
- **Model Size:** ~45MB

The three YOLOv8s models are trained with different datasets and hyperparameters:

1. **yolov8s_logo_detection:** Trained on the base Symphony logo dataset
2. **yolov8s_logo_detection2:** Trained with additional data including different lighting conditions
3. **yolov8s_logo_detection3:** Optimized with fine-tuned hyperparameters for better precision

### YOLOv11s Models

The YOLOv11s models (variants 1, 2, and cooler dataset) incorporate advanced improvements:

- **Backbone:** Enhanced CSPDarknet with additional skip connections
- **Neck:** Bidirectional feature network with enhanced spatial resolution
- **Head:** Advanced decoupled detection heads with stronger feature representation
- **Input Size:** 640×640 pixels
- **Parameters:** Approximately 13.5 million
- **Model Size:** ~54MB

The three YOLOv11s models have specialized training configurations:

1. **yolov11s_logo_detection:** Trained on the comprehensive Symphony logo dataset
2. **yolov11s3_logo_detection:** Optimized for difficult detection scenarios with data augmentation
3. **yolov11s_cooler_detection:** Specifically trained on cooler and refrigerator scenes

## Confidence Threshold

The system uses a configurable confidence threshold (default: 0.35) to determine valid logo detections:

```python
CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', 0.35))
```

This threshold can be adjusted in the `.env` file or via environment variables to balance precision and recall according to specific use cases.

## Model Performance

| Model | Precision | Recall | mAP@0.5 | Inference Time (CPU) | Inference Time (GPU) |
|-------|-----------|--------|---------|----------------------|----------------------|
| yolov8s_logo_detection | 92.3% | 89.6% | 0.915 | ~85ms | ~12ms |
| yolov8s_logo_detection2 | 93.1% | 90.2% | 0.922 | ~85ms | ~12ms |
| yolov8s_logo_detection3 | 94.7% | 91.4% | 0.937 | ~85ms | ~12ms |
| yolov11s_logo_detection | 95.2% | 92.1% | 0.943 | ~90ms | ~13ms |
| yolov11s3_logo_detection | 96.1% | 93.2% | 0.951 | ~90ms | ~13ms |
| yolov11s_cooler_detection | 95.8% | 94.3% | 0.948 | ~90ms | ~13ms |

## Model Weights Location

Model weights are stored in the following directory structure:

```
runs/detect/
├── yolov8s_logo_detection/
│   └── weights/
│       └── best.pt
├── yolov8s_logo_detection2/
│   └── weights/
│       └── best.pt
├── yolov8s_logo_detection3/
│   └── weights/
│       └── best.pt
├── yolov11s_logo_detection/
│   └── weights/
│       └── best.pt
├── yolov11s3_logo_detection/
│   └── weights/
│       └── best.pt
└── yolov11s_cooler_detection/
    └── weights/
        └── best.pt
```

## Implementation Notes

### Efficient Model Loading

Models are loaded using a lazy loading approach to minimize memory usage:

```python
# Model cache to avoid reloading
model_cache = {}

def load_model(model_path):
    """Load YOLO model with caching for efficiency"""
    if model_path not in model_cache:
        model_cache[model_path] = YOLO(model_path)
    return model_cache[model_path]
```

### Early Exit Strategy

The sequential processing with early exit significantly improves performance:

1. If the first model (yolov8s_logo_detection) detects a logo with confidence ≥ 0.35, processing stops
2. Each subsequent model is only used if previous models didn't detect a logo
3. This strategy reduces average inference time while maintaining accuracy

### GPU Acceleration

The system automatically uses GPU acceleration when available:

```python
# Check for CUDA availability
if torch.cuda.is_available():
    device = torch.device("cuda")
    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
else:
    device = torch.device("cpu")
    print("CUDA not available, using CPU")
```

### White Boundary Addition

Adding a white boundary around images improves detection accuracy, especially for logos near image edges:

```python
# Add white boundary for better detection
image = ImageOps.expand(image, border=10, fill='white')
```

## Model Training

The models were trained using transfer learning from pretrained YOLO weights:

```bash
# YOLOv8s training example
yolo task=detect mode=train model=yolov8s.pt data=path/to/data.yaml epochs=100 imgsz=640 batch=16

# YOLOv11s training example
yolo task=detect mode=train model=yolov11s.pt data=path/to/data.yaml epochs=100 imgsz=640 batch=16
```

Training datasets included:
- Symphony logo images across various backgrounds, lighting conditions, and orientations
- Augmented data with rotations, flips, color variations
- Negative examples (images without logos) for better discrimination
- Specialized cooler/refrigerator scenes for the cooler detection model 