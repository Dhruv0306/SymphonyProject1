# API Reference

This document provides detailed information about the Symphony Logo Detection API endpoints.

## Authentication

All API requests require an API key passed in the header:
```http
X-API-Key: your-api-key-here
```

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
  -H "X-API-Key: your-api-key" \
  -F "file=@logo.jpg"
```

**Example (URL):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/logo.jpg"}'
```

#### Response

```json
{
  "status": "success",
  "has_logo": true,
  "confidence": 0.92,
  "model_used": "YOLOv8s",
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
curl -X POST "http://localhost:8000/api/start-batch" \
  -H "X-API-Key: your-api-key"
```

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Processing Images

```http
POST /api/check-logo/batch/
```

Process multiple images concurrently within a batch session.

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `files[]`: Array of image files (optional)
- `urls[]`: Array of image URLs (optional)
- `batch_id`: UUID from start-batch endpoint (optional)

**Example (Files with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/batch/" \
  -H "X-API-Key: your-api-key" \
  -F "files[]=@logo1.jpg" \
  -F "files[]=@logo2.jpg" \
  -F "batch_id=550e8400-e29b-41d4-a716-446655440000"
```

**Example (URLs with Batch ID):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/batch/" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/logo1.jpg", "https://example.com/logo2.jpg"],
    "batch_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response:**
```json
{
  "status": "success",
  "results": [
    {
      "Image_Path_or_URL": "logo1.jpg",
      "Is_Valid": true,
      "Error": null
    },
    {
      "Image_Path_or_URL": "logo2.jpg",
      "Is_Valid": false,
      "Error": "No logo detected"
    }
  ]
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
  -H "X-API-Key: your-api-key" \
  --output results.csv
```

**Response:**
A CSV file with the following columns:
- Image_Path_or_URL: Path or URL of the processed image
- Is_Valid: Whether a valid logo was detected ("Valid" or "Invalid")
- Error: Error message if any occurred during processing

The file is named: `logo_detection_results_{batch_id}.csv`

### 4. Batch Statistics

```http
GET /api/check-logo/batch/getCount?batch_id={batch_id}
```

Retrieve processing statistics for a specific batch.

**Parameters:**
- `batch_id`: (Required) The UUID of the batch session to query

**Example:**
```bash
curl -X GET "http://localhost:8000/api/check-logo/batch/getCount?batch_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "X-API-Key: your-api-key"
```

**Response:**
```json
{
  "valid": 120,
  "invalid": 30,
  "total": 150
}
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "code": "invalid_input",
  "message": "Invalid file format. Supported formats: JPG, PNG"
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "code": "unauthorized",
  "message": "Invalid or missing API key"
}
```

### 429 Too Many Requests

```json
{
  "status": "error",
  "code": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Try again in 60 seconds"
}
```

## Rate Limiting

- Default: 100 requests per minute
- Batch endpoints: 20 requests per minute
- Export endpoints: 10 requests per minute
- Headers returned:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Best Practices

1. Use batch processing for multiple images
2. Always start with creating a batch session for large processing jobs
3. Use the batch_id to track and manage related image processing tasks
4. Implement exponential backoff for retries
5. Cache results when possible
6. Monitor rate limits
7. Handle errors gracefully
8. Download CSV exports promptly as they are temporarily stored
9. Clean up completed batch sessions when no longer needed

## See Also

- [System Architecture](./architecture.md)
- [Data Flow Documentation](./architecture.md#data-flow-and-storage)
- [Error Handling](./architecture.md#error-handling-and-monitoring) 