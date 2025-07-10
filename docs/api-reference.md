# API Reference

The Symphony Logo Detection API is a FastAPI-based service that detects Symphony logos in images using YOLO-based machine learning models. The API supports both single image processing and batch processing with real-time WebSocket updates.

**Base URL:** `http://localhost:8000`  
**API Documentation:** `http://localhost:8000/docs`  
**Interactive API Explorer:** `http://localhost:8000/redoc`

## Main Endpoints (Business Logic)

### 1. Single Image Processing

#### Check Logo in Single Image (File Upload)
```http
POST /api/check-logo/single/
```

**Description:** Validate a single image for Symphony logo presence via file upload or image URL.

**Parameters:**
- `file` (UploadFile, optional): Image file to validate (JPG/PNG)
- `image_path` (str, optional): URL or path of the image to validate

**Rate Limit:** 100 requests/minute per IP

**Response:**
```json
{
  "image_path": "string",
  "is_valid": true,
  "confidence": 0.95,
  "model": "YOLOv8s #1",
  "bbox": {
    "x1": 100,
    "y1": 150,
    "x2": 300,
    "y2": 350
  },
  "error": null
}
```

#### Check Logo by URL (JSON)
```http
POST /api/check-logo/single/url
```

**Description:** Validate a single image by URL using JSON request body.

**Request Body:**
```json
{
  "image_path": "https://example.com/image.jpg"
}
```

**Rate Limit:** 100 requests/minute per IP

## 2. Batch Processing

### Start Batch Session
```http
POST /api/start-batch
```

**Description:** Initialize a new batch processing session and get a unique batch ID.

**Parameters:**
- `client_id` (str, optional): Client identifier for WebSocket association
- `email` (str, optional): Email for batch completion notification
- `X-Auth-Token` (header, optional): Admin authentication token

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Batch processing session started"
}
```

### Initialize Batch Tracking
```http
POST /api/init-batch
```

**Description:** Initialize batch tracking with total count before uploading chunks.

**Request Body:**
```json
{
  "batch_id": "string",
  "client_id": "string",
  "total": 100
}
```

### Process Batch
```http
POST /api/check-logo/batch/
```

**Description:** Start batch processing with files, zip archive, or URL list. Returns immediately for background processing.

**Parameters:**
- `files` (List[UploadFile], optional): List of image files
- `zip_file` (UploadFile, optional): Zip file containing images
- `batch_id` (str): Batch ID from start-batch endpoint
- `client_id` (str, optional): Client ID for WebSocket updates

**For URL processing (JSON body):**
```json
{
  "batch_id": "string",
  "client_id": "string",
  "image_paths": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Rate Limit:** 60 requests/minute per IP

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Batch processing started",
  "status": "processing"
}
```

### Get Batch Status
```http
GET /api/check-logo/batch/{batch_id}/status
```

**Description:** Get current status and progress of batch processing.

**Response:**
```json
{
  "batch_id": "string",
  "status": "processing",
  "processed": 50,
  "total": 100,
  "valid": 30,
  "invalid": 20,
  "progress_percentage": 50.0
}
```

### Complete Batch
```http
POST /api/check-logo/batch/{batch_id}/complete
```

**Description:** Mark batch as complete and finalize results.

### Send Batch Email Notification
```http
POST /api/check-logo/batch/{batch_id}/send-email
```

**Description:** Send batch summary email notification.

## 3. Export & Results

### Get Batch Count
```http
GET /check-logo/batch/getCount?batch_id={batch_id}
```

**Description:** Get count of processed items for a specific batch.

**Response:**
```json
{
  "valid": 30,
  "invalid": 20,
  "total": 50
}
```

### Export Batch Results to CSV
```http
GET /api/check-logo/batch/export-csv?batch_id={batch_id}
```

**Description:** Export batch processing results as downloadable CSV file.

**Rate Limit:** 10 requests/minute per IP

**Response:** CSV file download with filename `logo_detection_results_{batch_id}.csv`

### Get Export File
```http
GET /api/exports/{batch_id}/{filename}?token={auth_token}
```

**Description:** Download an exported file by batch ID and filename (requires authentication).

## 4. WebSocket Connections

### Batch Progress WebSocket
```http
WebSocket: /ws/batch/{batch_id}
```

**Description:** Real-time updates for batch processing progress with ping/pong support and 10-minute timeout.

**Messages:**
- **Ping:** `{"type": "ping", "timestamp": 1234567890}`
- **Pong:** `{"type": "pong", "timestamp": 1234567890}`
- **Progress Updates:** Automatic progress notifications

### Client WebSocket
```http
WebSocket: /ws/{client_id}
```

**Description:** General WebSocket endpoint for client connections with heartbeat support.

**Messages:**
- **Heartbeat:** `{"event": "heartbeat", "timestamp": 1234567890}`
- **Heartbeat ACK:** `{"event": "heartbeat_ack", "timestamp": 1234567890}`

## System Endpoints (Administrative & Infrastructure)

### 1. Authentication

#### Admin Login
```http
POST /api/admin/login
```

**Description:** Authenticate admin credentials and create session with CSRF protection.

**Request Body (Form Data):**
- `username` (str): Admin username
- `password` (str): Admin password

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "auth_token_here",
  "csrf_token": "csrf_token_here"
}
```

#### Admin Logout
```http
POST /api/admin/logout
```

**Headers:**
- `X-Auth-Token`: Session token
- `X-CSRF-Token`: CSRF token

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### Check Admin Session
```http
GET /api/admin/check-session
```

**Headers:**
- `X-Auth-Token`: Session token

**Response:**
```json
{
  "status": "success",
  "authenticated": true
}
```

### 2. Admin Dashboard & Statistics

#### Get Dashboard Statistics
```http
GET /api/admin/dashboard-stats
```

**Headers:**
- `X-Auth-Token`: Admin session token

**Description:** Get key metrics for admin dashboard.

**Response:**
```json
{
  "batches_today": 15,
  "success_rate": 92.5,
  "avg_processing_time": 45.2,
  "error_rate": 7.5
}
```

### 3. Batch History Management

#### Get Batch History
```http
GET /api/admin/batch-history
```

**Headers:**
- `X-Auth-Token`: Admin session token

**Description:** Get history of all processed batches (admin only).

**Response:**
```json
[
  {
    "batch_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "550e8400-e29b-41d4-a716-446655440000/results.csv",
    "created_at": "2024-01-15T10:30:00",
    "file_size": 15420,
    "download_url": "/api/exports/550e8400-e29b-41d4-a716-446655440000/results.csv",
    "valid_count": 85,
    "invalid_count": 15,
    "total_count": 100
  }
]
```

#### Get Batch Details
```http
GET /api/admin/batch/{batch_id}
```

**Headers:**
- `X-Auth-Token`: Admin session token

**Description:** Get detailed information about a specific batch.

**Response:**
```json
{
  "batch_id": "string",
  "filename": "string",
  "created_at": "2024-01-15T10:30:00",
  "file_size": 15420,
  "download_url": "string",
  "valid_count": 85,
  "invalid_count": 15,
  "total_count": 100,
  "metadata": {
    "status": "completed",
    "email": "user@example.com"
  }
}
```

#### Get Batch Preview
```http
GET /api/admin/batch/{batch_id}/preview
```

**Headers:**
- `X-Auth-Token`: Admin session token

**Description:** Get preview of first 5 entries in batch results.

**Response:**
```json
{
  "batch_id": "string",
  "preview": [
    {
      "Image_Path_or_URL": "example.jpg",
      "Is_Valid": "Valid",
      "Confidence": "0.92",
      "Detected_By": "YOLOv8s #1",
      "Bounding_Box": "{\"x1\": 100, \"y1\": 150, \"x2\": 300, \"y2\": 350}",
      "Error": null
    }
  ]
}
```

### 4. System Maintenance

#### Manual Cleanup
```http
POST /maintenance/cleanup
```

**Headers:**
- `X-Auth-Token`: Admin session token

**Parameters:**
- `batch_age_hours` (int, default=24): Max age for batch files
- `temp_age_minutes` (int, default=30): Max age for temp files
- `pending_age_hours` (int, default=72): Max age for pending batches (3 days)

**Rate Limit:** 2 requests/minute per IP

**Description:** Manually trigger cleanup of old files with smart pending batch protection.

**Response:**
```json
{
  "status": "success",
  "batches_cleaned": 5,
  "temp_files_cleaned": 12,
  "pending_batches_cleaned": 2,
  "batch_age_hours": 24,
  "temp_age_minutes": 30,
  "pending_age_hours": 72
}
```

## Error Responses

### Common HTTP Status Codes

- **400 Bad Request:** Invalid input or missing required fields
- **401 Unauthorized:** Authentication required or invalid credentials
- **403 Forbidden:** Invalid CSRF token or insufficient permissions
- **404 Not Found:** Batch or resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server-side processing error

### Error Response Format
```json
{
  "detail": "Error description here"
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Single image processing | 100/minute per IP |
| Batch processing | 60/minute per IP |
| CSV export | 10/minute per IP |
| Manual cleanup | 2/minute per IP |

## Authentication

- **Session-based:** Admin endpoints use session tokens
- **CSRF Protection:** Admin state-changing operations require CSRF tokens
- **Token Headers:** 
  - `X-Auth-Token`: Session authentication
  - `X-CSRF-Token`: CSRF protection

## WebSocket Features

- **Auto-reconnection:** Clients can recover previous batch associations
- **Heartbeat Support:** Automatic connection health monitoring
- **Timeout Handling:** 10-minute inactivity timeout for batch connections
- **Real-time Updates:** Live progress updates during batch processing

## File Support

- **Image Formats:** JPG, PNG, WEBP, BMP
- **Batch Uploads:** Multiple files, ZIP archives, URL lists
- **Export Formats:** CSV with detailed results and metadata 