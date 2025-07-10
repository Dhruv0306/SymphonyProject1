# Getting Started Guide

Welcome to the Symphony Logo Detection System! This guide will help you get up and running with the system quickly.

## System Overview

The Symphony Logo Detection System is designed to automatically detect and validate Symphony logos in images. The system supports both:

1. **Single Image Processing** - Validate one image at a time
2. **Batch Processing** - Process multiple images in bulk with real-time progress tracking

## Basic Workflow

### Single Image Processing

1. **Access the application** at http://localhost:3000
2. **Select "Single Mode"** in the interface
3. **Upload an image** by either:
   - Dragging and dropping a file
   - Clicking to open the file browser
   - Entering an image URL
4. **View results** immediately on the screen
   - ✅ Green indicators for valid Symphony logos
   - ❌ Red indicators for invalid/no Symphony logos
   - Confidence score and bounding box for valid detections

### Batch Processing

1. **Access the application** at http://localhost:3000
2. **Select "Batch Mode"** in the interface
3. **Upload multiple images** using one of these methods:
   - Drag and drop multiple files
   - Select multiple files via the file browser
   - Upload a ZIP file containing images
   - Provide a list of image URLs
4. **Optional: Enter your email** for notification when processing completes
5. **Start processing** by clicking "Start Batch Processing"
6. **Monitor progress** in real-time:
   - Overall progress bar
   - Per-file status indicators
   - Estimated time remaining
7. **View and download results** upon completion:
   - Summary statistics (valid/invalid counts)
   - Detailed results for each image
   - Export to CSV option

## Example Use Cases

### Product Packaging Validation

Verify that Symphony logos appear correctly on product packaging:

1. **Collect product photos** from various angles
2. **Upload as batch** to the system
3. **Review results** to identify packaging without valid logos
4. **Export CSV report** for documentation

### Marketing Material Compliance

Ensure marketing materials adhere to Symphony branding guidelines:

1. **Gather digital marketing assets** (social media images, ads, etc.)
2. **Process through the system** in batch mode
3. **Identify non-compliant materials** for correction
4. **Implement process** as part of standard marketing workflow

### Real-time Image Validation

Integrate with content workflows for immediate logo validation:

1. **Use the API endpoints** to send images as they're created
2. **Receive immediate validation results** via API response
3. **Automatically flag** images for review when logos are missing or incorrect
4. **Create approval workflows** based on validation results

## Tips for Best Results

1. **Image Quality Matters**:
   - Ensure adequate lighting and clarity
   - Minimum recommended resolution: 640×640 pixels
   - Supported formats: JPG, PNG, WEBP, BMP

2. **Batch Processing Optimization**:
   - For very large batches (>300 files), use ZIP files
   - Provide an email for notification on large batches
   - Use the chunk size selector to optimize for your network conditions

3. **Performance Considerations**:
   - The system processes images sequentially through multiple models
   - Early detection return improves processing speed
   - Detection speed depends on server resources (CPU/GPU)

## API Integration Examples

### Single Image Validation

```python
import requests

# Validate a single image by URL
response = requests.post(
    "http://localhost:8000/api/check-logo/single/",
    json={"image_path": "https://example.com/image.jpg"}
)

result = response.json()
if result["is_valid"] == "Valid":
    print(f"Logo detected with {result['confidence']:.2f} confidence")
else:
    print("No logo detected")
```

### Batch Processing

```python
import requests
import json
import time

# Initialize batch session
batch_init = requests.post(
    "http://localhost:8000/api/start-batch",
    json={"client_id": "my_client_123"}
)
batch_id = batch_init.json()["batch_id"]

# Process batch with URLs
urls = ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
batch_request = requests.post(
    "http://localhost:8000/api/check-logo/batch/",
    json={
        "batch_id": batch_id,
        "client_id": "my_client_123",
        "image_paths": urls
    }
)

# Check status until complete
while True:
    status = requests.get(
        f"http://localhost:8000/api/check-logo/batch/{batch_id}/status"
    ).json()
    
    print(f"Progress: {status['progress_percentage']}%")
    
    if status["status"] == "completed":
        break
    
    time.sleep(1)

# Download results as CSV
csv_url = f"http://localhost:8000/api/check-logo/batch/export-csv?batch_id={batch_id}"
csv_data = requests.get(csv_url)

with open("results.csv", "wb") as f:
    f.write(csv_data.content)
```

## Next Steps

Now that you're familiar with the basic functionality, explore these resources for more advanced usage:

1. **[Installation Guide](installation.md)** - For setting up the system on your own server
2. **[API Reference](api-reference.md)** - Complete API documentation for integration
3. **[Batch Processing](batch-processing.md)** - Detailed information on fault-tolerant batch processing
4. **[Configuration Guide](configuration.md)** - Customize the system to your needs
5. **[Model Details](model-details.md)** - Technical details about the YOLO models

If you encounter any issues or have questions, please refer to the documentation or contact the support team. 