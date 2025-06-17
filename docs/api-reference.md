# API Reference

This document provides detailed information about the Symphony Logo Detection API endpoints.

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
POST /api/v2/check-logo/single/
```

Validates a single image for Symphony logo presence.

#### Request

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `file`: Image file (when using multipart/form-data)
- `url`: Image URL (when using application/json)

**Example (File Upload):**
```bash
curl -X POST "http://localhost:8000/api/v2/check-logo/single/" \
  -F "file=@logo.jpg"
```

**Example (URL):**
```bash
curl -X POST "http://localhost:8000/api/v2/check-logo/single/" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/logo.jpg"}'
```

#### Response

```json
{
  "status": "success",
  "has_logo": true,
  "confidence": 0.92,
  "model_used": "YOLOv8n",
  "processing_time": 0.8,
  "bounding_box": {
    "x1": 100,
    "y1": 150,
    "x2": 300,
    "y2": 350
  }
}
```

### 2. Batch Processing

#### Start Batch

```http
POST /api/v2/start-batch
```

Start a new batch processing session.

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Batch processing session started"
}
```

#### Process Batch

```http
POST /api/v2/check-logo/batch/
```

Process multiple images within a batch session. Supports both file uploads and URL processing.

**Rate Limit:** 30 requests per minute with automatic retry and exponential backoff.

**Content Types:**
- `multipart/form-data` for file uploads
- `application/json` for URL processing

**Parameters for File Upload:**
- `files[]`: Array of image files
- `batch_id`: UUID from start-batch endpoint (optional)

**Parameters for URL Processing (JSON):**
```json
{
  "image_paths": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "batch_id": "550e8400-e29b-41d4-a716-446655440000"  // optional
}
```

**Example (Files with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/v2/check-logo/batch/" \
  -F "files[]=@logo1.jpg" \
  -F "files[]=@logo2.jpg" \
  -F "batch_id=550e8400-e29b-41d4-a716-446655440000"
```

**Example (URLs with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/v2/check-logo/batch/" \
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
  "total_processed": 2,
  "valid_count": 1,
  "invalid_count": 1,
  "results": [
    {
      "Image_Path_or_URL": "logo1.jpg",
      "Is_Valid": "Valid",
      "Confidence": 0.92,
      "Detected_By": "YOLOv8n",
      "Bounding_Box": {
        "x1": 100,
        "y1": 150,
        "x2": 300,
        "y2": 350
      },
      "Error": null
    },
    {
      "Image_Path_or_URL": "logo2.jpg",
      "Is_Valid": "Invalid",
      "Confidence": null,
      "Detected_By": null,
      "Bounding_Box": null,
      "Error": "No logo detected"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request format or missing required fields
- `429 Too Many Requests`: Rate limit exceeded (will automatically retry with backoff)
- `500 Internal Server Error`: Server-side processing error

**Notes:**
1. The endpoint supports both file uploads and URL processing
2. Rate limiting is set to 20 requests per minute
3. Automatic retry with exponential backoff is implemented for rate limit errors
4. Batch ID is optional but recommended for tracking and resuming operations
5. Results are stored in CSV format if a batch ID is provided
6. Both single files/URLs and batches are supported
7. Progress tracking is available through the batch status endpoint

### 3. Batch Results Export

```http
GET /api/v2/check-logo/batch/export-csv?batch_id={batch_id}
```

Export the batch processing results as a CSV file.

**Parameters:**
- `batch_id`: (Required) The UUID of the batch session to export

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v2/check-logo/batch/export-csv?batch_id=550e8400-e29b-41d4-a716-446655440000" \
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

The file is named: `logo_detection_results_{batch_id}_{timestamp}.csv`

### 4. Batch Statistics

```http
GET /api/v2/check-logo/batch/stats?batch_id={batch_id}
```

Retrieve processing statistics for a specific batch.

**Parameters:**
- `batch_id`: (Required) The UUID of the batch session to query

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v2/check-logo/batch/stats?batch_id=550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "statistics": {
    "valid": 120,
    "invalid": 30,
    "total": 150,
    "model_usage": {
      "YOLOv8n": 85,
      "YOLOv8s": 35,
      "YOLOv8m": 20,
      "YOLOv8l": 10
    }
  },
  "rate_limit": {
    "limit": 30,
    "remaining": 29,
    "reset": 60
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "code": "invalid_input",
  "message": "Invalid file format. Supported formats: JPG, PNG",
  "details": {
    "supported_formats": ["jpg", "jpeg", "png"],
    "max_file_size": "10MB"
  }
}
```

### 429 Too Many Requests

```json
{
  "status": "error",
  "code": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Try again later.",
  "rate_limit": {
    "limit": 150,
    "reset": 60,
    "endpoint": "single"
  }
}
```

## Best Practices

1. Monitor rate limits via response headers
2. Use batch processing for multiple images
3. Start with a batch session for large processing jobs
4. Implement exponential backoff for rate limit retries
5. Download CSV exports promptly (temporary storage)
6. Clean up completed batch sessions
7. Check model confidence scores
8. Handle rate limits gracefully
9. Validate file types and sizes before upload

## See Also

- [System Architecture](./architecture.md)
- [Security & Rate Limiting](./architecture.md#security-and-rate-limiting)
- [Model Architecture](./architecture.md#model-architecture) 

### 5. Analytics Dashboard

```http
GET /api/v2/analytics/dashboard
```

Retrieve analytics data for the dashboard.

**Parameters:**
- `period`: (Optional) Time period for analytics data (default: "day", options: "day", "week", "month")
- `format`: (Optional) Response format (default: "json", options: "json", "csv")

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v2/analytics/dashboard?period=week"
```

**Response:**
```json
{
  "period": "week",
  "total_processed": 12450,
  "valid_count": 9876,
  "invalid_count": 2574,
  "average_confidence": 0.87,
  "model_distribution": {
    "YOLOv8n": 65,
    "YOLOv8s": 22,
    "YOLOv8m": 8,
    "YOLOv8l": 5
  },
  "processing_times": {
    "average_ms": 245,
    "p50_ms": 220,
    "p95_ms": 450,
    "p99_ms": 780
  },
  "daily_stats": [
    {
      "date": "2024-05-01",
      "processed": 1823,
      "valid": 1456,
      "invalid": 367
    },
    {
      "date": "2024-05-02",
      "processed": 1756,
      "valid": 1398,
      "invalid": 358
    }
    // Additional days...
  ]
}
```

### 6. Model Performance

```http
GET /api/v2/analytics/model-performance
```

Retrieve detailed model performance metrics.

**Parameters:**
- `model`: (Optional) Specific model to query (options: "YOLOv8n", "YOLOv8s", "YOLOv8m", "YOLOv8l")
- `period`: (Optional) Time period for analytics data (default: "day", options: "day", "week", "month")

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v2/analytics/model-performance?model=YOLOv8n&period=week"
```

**Response:**
```json
{
  "model": "YOLOv8n",
  "period": "week",
  "usage_count": 8125,
  "success_rate": 0.92,
  "average_confidence": 0.86,
  "average_inference_time_ms": 120,
  "confidence_distribution": {
    "0.40-0.50": 320,
    "0.50-0.60": 645,
    "0.60-0.70": 1245,
    "0.70-0.80": 2356,
    "0.80-0.90": 2458,
    "0.90-1.00": 1101
  },
  "daily_performance": [
    {
      "date": "2024-05-01",
      "usage_count": 1180,
      "success_rate": 0.93,
      "average_confidence": 0.87
    },
    {
      "date": "2024-05-02",
      "usage_count": 1142,
      "success_rate": 0.91,
      "average_confidence": 0.85
    }
    // Additional days...
  ]
}
```