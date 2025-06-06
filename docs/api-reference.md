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

```http
POST /api/check-logo/batch/
```

Process multiple images concurrently.

#### Request

**Content-Type:** `multipart/form-data` or `application/json`

**Parameters:**
- `files[]`: Array of image files
- `urls[]`: Array of image URLs

**Example (Files):**
```bash
curl -X POST "http://localhost:8000/api/check-logo/batch/" \
  -H "X-API-Key: your-api-key" \
  -F "files[]=@logo1.jpg" \
  -F "files[]=@logo2.jpg"
```

#### Response

```json
{
  "status": "success",
  "results": [
    {
      "filename": "logo1.jpg",
      "has_logo": true,
      "confidence": 0.88
    },
    {
      "filename": "logo2.jpg",
      "has_logo": false,
      "confidence": 0.15
    }
  ],
  "processing_time": 3.2
}
```

### 3. Batch Results Export

```http
GET /api/check-logo/batch/export-csv
```

Export the latest batch processing results as a CSV file.

#### Request

No parameters required. The endpoint returns results from the most recent batch processing operation.

**Example:**
```bash
curl -X GET "http://localhost:8000/api/check-logo/batch/export-csv" \
  -H "X-API-Key: your-api-key" \
  --output results.csv
```

#### Response

A CSV file with the following columns:
- Image_Path_or_URL
- Is_Valid
- Error (if any)

The file is named with a timestamp: `logo_detection_results_YYYYMMDD_HHMMSS.csv`

### 4. Batch Statistics

```http
GET /api/check-logo/batch/getCount
```

Retrieve processing statistics.

#### Response

```json
{
  "total_processed": 150,
  "valid_logos": 120,
  "invalid_logos": 30,
  "average_confidence": 0.82,
  "average_processing_time": 0.9
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
2. Implement exponential backoff for retries
3. Cache results when possible
4. Monitor rate limits
5. Handle errors gracefully
6. Download CSV exports promptly as they are temporarily stored

## See Also

- [System Architecture](./architecture.md)
- [Data Flow Documentation](./architecture.md#data-flow-and-storage)
- [Error Handling](./architecture.md#error-handling-and-monitoring) 