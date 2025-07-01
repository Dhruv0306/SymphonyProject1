# API Reference

This document provides detailed information about the Symphony Logo Detection API endpoints.

## System Overview

The Symphony Logo Detection System is an enterprise-grade platform that uses 5 sequential YOLO models (YOLOv8s and YOLOv11s variants) for high-accuracy logo detection. The system features:

- **FastAPI Backend** with async processing and WebSocket support
- **React Frontend** with real-time progress tracking
- **Batch Processing** with automatic retry and error handling
- **Admin Dashboard** with comprehensive analytics
- **Automated Cleanup** via APScheduler for resource management

## Authentication

All API requests require an API key passed in the header:
```http
X-API-Key: your-api-key-here
```

## Rate Limiting

The API uses SlowAPI for rate limiting with the following constraints:

- Single image endpoint: 150 requests per minute
- Batch processing endpoints: 30 requests per minute
- CSV export endpoints: 25 requests per minute
- Analytics API endpoints: 50 requests per minute

Rate limit headers returned:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Endpoints

### 1. Single Image Validation

```http
POST /api/check-logo/single/
```

Validates a single image for Symphony logo presence using sequential YOLO model testing.

#### Request

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `file`: Image file (when using multipart/form-data)
  - **Supported formats:** JPG, JPEG, PNG, WEBP, BMP
- `image_path`: Image URL (when using application/json)
  - **Supported formats:** JPG, JPEG, PNG, WEBP, BMP

**Example (File Upload):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -F "file=@logo.jpg"
```

**Example (URL):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -H "Content-Type: application/json" \
  -d '{"image_path": "https://example.com/logo.jpg"}'
```

#### Response

```json
{
  "Image_Path_or_URL": "logo.jpg",
  "Is_Valid": "Valid",
  "Confidence": 0.92,
  "Detected_By": "yolov8s_logo_detection",
  "Bounding_Box": [100, 150, 300, 350],
  "Processing_Time": 0.8
}
```

### 2. Batch Processing

#### Start Batch

```http
POST /api/start-batch
```

Start a new batch processing session.

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Batch created successfully"
}
```

#### Initialize Batch

```http
POST /api/init-batch
```

Initialize batch parameters before processing.

**Parameters:**
- `batch_id`: UUID from start-batch endpoint
- `client_id`: Unique client identifier
- `total`: Total number of images to process

**Example:**
```bash
curl -X POST "http://localhost:8000/api/init-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "550e8400-e29b-41d4-a716-446655440000",
    "client_id": "client-123",
    "total": 50
  }'
```

#### Process Batch

```http
POST /api/check-logo/batch/
```

Process multiple images within a batch session. Supports both file uploads and URL processing.

**Rate Limit:** 30 requests per minute with automatic retry and exponential backoff.

**Content Types:**
- `multipart/form-data` for file uploads
- `application/json` for URL processing

**Parameters for File Upload:**
- `files[]`: Array of image files
  - **Supported formats:** JPG, JPEG, PNG, WEBP, BMP
- `batch_id`: UUID from start-batch endpoint

**Parameters for URL Processing (JSON):**
```json
{
  "image_paths": ["https://example.com/image1.jpg", "https://example.com/image2.png", "https://example.com/image3.webp", "https://example.com/image4.bmp"],
  "batch_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example (Files with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/batch/" \
  -F "files[]=@logo1.jpg" \
  -F "files[]=@logo2.jpg" \
  -F "batch_id=550e8400-e29b-41d4-a716-446655440000"
```

**Example (URLs with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/batch/" \
  -H "Content-Type: application/json" \
  -d '{
    "image_paths": [
      "https://example.com/logo1.jpg",
      "https://example.com/logo2.jpg"
    ],
    "batch_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processing complete",
  "status": "processing"
}
```

#### Batch Status

```http
GET /api/check-logo/batch/{batch_id}/status
```

Check the status of a batch processing session.

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "counts": {
    "total": 100,
    "processed": 100,
    "valid": 85,
    "invalid": 15
  },
  "progress": 100
}
```

### 3. Batch Results Export

```http
GET /api/check-logo/batch/export-csv/{batch_id}
```

Export the batch processing results as a CSV file.

**Parameters:**
- `batch_id`: (Required) The UUID of the batch session to export

**Example:**
```bash
curl -X GET "http://localhost:8000/api/check-logo/batch/export-csv/550e8400-e29b-41d4-a716-446655440000" \
  --output results.csv
```

**Response:**
A CSV file with the following columns:
- Image_Path_or_URL: Path or URL of the processed image
- Is_Valid: Whether a valid logo was detected ("Valid" or "Invalid")
- Confidence: Confidence score of the detection (0.0 to 1.0)
- Detected_By: Which model made the detection
- Bounding_Box: Coordinates of the detected logo
- Error: Error message if any occurred during processing
- Timestamp: When the image was processed
- Batch_ID: The batch session ID

The file is named: `batch_{batch_id}_results.csv`

### 4. WebSocket Endpoints

```http
WS /ws/batch/{batch_id}
```

Real-time WebSocket connection for batch processing updates.

**Connection URL:** `ws://localhost:8000/ws/batch/{batch_id}`

**Message Types:**
- `progress`: Processing progress updates
- `ping`: Keep-alive messages
- `pong`: Client response to ping
- `error`: Error notifications
- `complete`: Batch completion notification

**Example Messages:**
```json
{
  "type": "progress",
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "processed": 25,
  "total": 100,
  "progress": 25
}
```

### 5. Admin Endpoints

#### Admin Login

```http
POST /api/admin/login
```

Authenticate admin user and create session.

**Parameters:**
- `username`: Admin username
- `password`: Admin password

**Response:**
```json
{
  "message": "Login successful",
  "session_duration": 1800
}
```

#### Admin Dashboard Stats

```http
GET /api/admin/dashboard-stats
```

Retrieve dashboard statistics (admin only).

**Response:**
```json
{
  "total_batches": 150,
  "total_images_processed": 12450,
  "valid_detections": 9876,
  "invalid_detections": 2574,
  "average_confidence": 0.87,
  "model_usage": {
    "yolov8s_logo_detection": 4500,
    "yolov8s_logo_detection2": 3200,
    "yolov8s_logo_detection3": 2100,
    "yolov11s_logo_detection": 1800,
    "yolov11s3_logo_detection": 850
  }
}
```

#### Batch History

```http
GET /api/admin/batch-history
```

Retrieve batch processing history (admin only).

**Parameters:**
- `limit`: (Optional) Number of batches to return (default: 50)
- `offset`: (Optional) Offset for pagination (default: 0)

**Response:**
```json
{
  "batches": [
    {
      "batch_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00Z",
      "status": "completed",
      "total_images": 100,
      "valid_count": 85,
      "invalid_count": 15,
      "processing_time": 45.2
    }
  ],
  "total_count": 150,
  "has_more": true
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid file format. Supported formats: JPG, JPEG, PNG, WEBP, BMP",
  "status_code": 400,
  "supported_formats": ["jpg", "jpeg", "png", "webp", "bmp"],
  "max_file_size": "10MB"
}
```

### 404 Not Found

```json
{
  "detail": "Batch not found with ID: invalid-batch-id",
  "status_code": 404
}
```

### 429 Too Many Requests

```json
{
  "detail": "Rate limit exceeded. Try again later.",
  "status_code": 429,
  "rate_limit": {
    "limit": 30,
    "reset": 60,
    "endpoint": "batch"
  }
}
```

### 500 Internal Server Error

```json
{
  "detail": "Model inference failed",
  "status_code": 500,
  "error_type": "model_error"
}
```

## Model Architecture

The system uses 5 sequential YOLO models with early return optimization:

1. **yolov8s_logo_detection** - Primary YOLOv8s model
2. **yolov8s_logo_detection2** - Enhanced YOLOv8s variant
3. **yolov8s_logo_detection3** - Refined YOLOv8s model
4. **yolov11s_logo_detection** - Advanced YOLOv11s model
5. **yolov11s3_logo_detection** - Optimized YOLOv11s variant

**Processing Flow:**
- Images are enhanced with 10px white boundary
- Models are tested sequentially with confidence threshold 0.35
- Processing stops at first successful detection (early return)
- If no model detects a logo, result is marked as "Invalid"

## Best Practices

1. Use batch processing for multiple images (more efficient)
2. Start with a batch session for large processing jobs
3. Monitor WebSocket connections for real-time updates
4. Implement exponential backoff for rate limit retries
5. Download CSV exports promptly (24-hour retention)
6. Handle rate limits gracefully with retry logic
7. Validate file types and sizes before upload
8. Use appropriate confidence thresholds for your use case

## See Also

- [System Architecture](./architecture.md)
- [Getting Started Guide](./getting-started.md)
- [Error Handling Guide](./error-handling.md)
- [Security Guidelines](./security.md)