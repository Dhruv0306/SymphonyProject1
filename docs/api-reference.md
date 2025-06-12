# API Reference

This document provides detailed information about the Symphony Logo Detection API endpoints.

## Authentication

All API requests require an API key passed in the header:
```http
X-API-Key: your-api-key-here
```

## Rate Limiting

The API uses SlowAPI for rate limiting with the following constraints:

- Single image endpoint: 100 requests per minute
- Batch processing endpoints: 20 requests per minute
- CSV export endpoints: 20 requests per minute

Rate limit headers returned:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Endpoints

### 1. Single Image Validation

```http
POST /api/check-logo/single/
```

Validates a single image for Symphony logo presence.

#### Request

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `file`: Image file (when using multipart/form-data)
- `url`: Image URL (when using application/json)

**Example (File Upload):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -F "file=@logo.jpg"
```

**Example (URL):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/logo.jpg"}'
```

#### Response

```json
{
  "status": "success",
  "has_logo": true,
  "confidence": 0.92,
  "model_used": "YOLOv8s #1",
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

#### Starting a Batch Session

```http
POST /api/start-batch
```

Initializes a new batch processing session and returns a unique batch ID.

**Example:**
```bash
curl -X POST "http://localhost:8000/api/start-batch"
```

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "rate_limit": {
    "limit": 20,
    "remaining": 19,
    "reset": 60
  }
}
```

#### Processing Images

```http
POST /api/check-logo/batch/
```

Process multiple images within a batch session.

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `files[]`: Array of image files (optional)
- `urls[]`: Array of image URLs (optional)
- `batch_id`: UUID from start-batch endpoint (required)

**Example (Files with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/batch/" \
  -F "files[]=@logo1.jpg" \
  -F "files[]=@logo2.jpg" \
  -F "batch_id=550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "status": "success",
  "results": [
    {
      "Image_Path_or_URL": "logo1.jpg",
      "Is_Valid": "Valid",
      "Confidence": 0.92,
      "Detected_By": "YOLOv8s #1",
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
  ],
  "rate_limit": {
    "limit": 20,
    "remaining": 18,
    "reset": 60
  }
}
```

### 3. Batch Results Export

```http
GET /api/check-logo/batch/export-csv?batch_id={batch_id}
```

Export the batch processing results as a CSV file.

**Parameters:**
- `batch_id`: (Required) The UUID of the batch session to export

**Example:**
```bash
curl -X GET "http://localhost:8000/api/check-logo/batch/export-csv?batch_id=550e8400-e29b-41d4-a716-446655440000" \
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
GET /api/check-logo/batch/stats?batch_id={batch_id}
```

Retrieve processing statistics for a specific batch.

**Parameters:**
- `batch_id`: (Required) The UUID of the batch session to query

**Example:**
```bash
curl -X GET "http://localhost:8000/api/check-logo/batch/stats?batch_id=550e8400-e29b-41d4-a716-446655440000"
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
      "YOLOv8s #1": 85,
      "YOLOv8s #2": 20,
      "YOLOv8s #3": 10,
      "YOLOv11s": 5
    }
  },
  "rate_limit": {
    "limit": 20,
    "remaining": 19,
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
    "limit": 100,
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