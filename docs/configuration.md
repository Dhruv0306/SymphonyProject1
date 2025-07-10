# Configuration Guide

The Symphony Logo Detection System offers extensive configuration options to adapt the system to your specific requirements and environment.

## Environment Configuration

The system uses a `.env` file for sensitive and environment-specific configuration. A template is provided as `.env.example`—copy this file to `.env` and customize it according to your needs.

**Important:** Never commit your real `.env` file to version control.

### Required Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_USERNAME` | ✅ | `admin` | Admin login username |
| `ADMIN_PASSWORD` | ✅ | - | Admin login password |
| `SMTP_SERVER` | ❌ | - | Email server for notifications |
| `SMTP_PORT` | ❌ | `587` | Email server port |
| `SMTP_USERNAME` | ❌ | - | Email authentication username |
| `SMTP_PASSWORD` | ❌ | - | Email authentication password |
| `SENDER_EMAIL` | ❌ | - | From email address |
| `SENDER_NAME` | ❌ | `Symphony Logo Detection` | From name |
| `SESSION_DURATION` | ❌ | `1800` | Admin session duration (seconds) |
| `COOKIE_SECRET` | ❌ | auto-generated | Session cookie encryption key |
| `CONFIDENCE_THRESHOLD` | ❌ | `0.35` | YOLO detection confidence threshold |
| `YOLO_SERVICE_URL` | ❌ | `http://localhost:8001` | YOLO service endpoint |

### Example .env File

```env
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Email Configuration
SMTP_SERVER=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your_email@domain.com
SMTP_PASSWORD=your_email_password
SENDER_EMAIL=your_email@domain.com
SENDER_NAME=Symphony Logo Detection

# Security Settings
SESSION_DURATION=1800
COOKIE_SECRET=your_secure_cookie_secret

# YOLO Microservice Configuration
YOLO_SERVICE_URL=http://localhost:8001
CONFIDENCE_THRESHOLD=0.35
```

### Configuration Methods

The system supports multiple ways to provide configuration:

**1. .env File (Recommended)**
```env
# Create .env in project root
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
CONFIDENCE_THRESHOLD=0.35
```

**2. Environment Variables**
```bash
# Linux/Mac
export ADMIN_USERNAME=admin
export CONFIDENCE_THRESHOLD=0.4

# Windows
set ADMIN_USERNAME=admin
set CONFIDENCE_THRESHOLD=0.4
```

**3. CLI Arguments (Limited)**
```bash
# Backend host detection
uvicorn App:app --host 0.0.0.0 --port 8000

# Frontend configuration
npm run start-backend -- --backend=http://localhost:8000 --port=3000
```

> **Override Priority:** CLI Arguments > Environment Variables > .env File > Defaults

## Frontend Configuration

The frontend configuration is managed through environment variables and the `set-backend.js` script:

### Using set-backend.js

```bash
# Start frontend with custom backend URL and port
npm run start-backend -- --backend=http://your-backend-url:8000 --port=3000

# Available parameters
--backend=<url>  # Set custom backend URL (default: http://localhost:8000)
--port=<port>    # Set custom frontend port (default: 3000)
--host=<host>    # Set custom host IP (default: localhost)
```

### Using config.js

The frontend's main configuration file is `frontend/src/config.js`. You can edit this file directly for more permanent changes:

```javascript
// Example config.js
export const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
export const APP_NAME = "Symphony Logo Detection System";
```

## Backend Configuration

### Host & Port Configuration

```bash
# Default settings
uvicorn App:app --reload

# Custom host and port
uvicorn App:app --host 0.0.0.0 --port 8000

# Production with multiple workers
uvicorn App:app --host 0.0.0.0 --port 8000 --workers 4
```

### Automatic Host Detection

The backend automatically detects custom host configurations and sets the YOLO service URL accordingly:

```python
# Automatic host detection in App.py
if '--host' in sys.argv:
    host_index = sys.argv.index('--host')
    if host_index + 1 < len(sys.argv):
        host = sys.argv[host_index + 1]
        if host != 'localhost' and host != '127.0.0.1':
            os.environ['YOLO_SERVICE_URL'] = f'http://{host}:8001'
```

## YOLO Service Configuration

### Host & Port Configuration

```bash
# Default settings
cd yolo_service
python start.py

# Custom host and port
cd yolo_service
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Model Configuration

The YOLO models are configured in `yolo_service/detect_logo.py`:

```python
MODEL_PATHS = [
    "runs/detect/yolov8s_logo_detection/weights/best.pt",    # Primary YOLOv8s model
    "runs/detect/yolov8s_logo_detection2/weights/best.pt",   # Enhanced with additional data
    "runs/detect/yolov8s_logo_detection3/weights/best.pt",   # Refined parameters
    "runs/detect/yolov11s_logo_detection/weights/best.pt",   # YOLOv11s model
    "runs/detect/yolov11s3_logo_detection/weights/best.pt",  # Optimized YOLOv11s
    "runs/detect/yolov11s_cooler_detection/weights/best.pt"  # YOLOv11s with cooler dataset
]

CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', 0.35))
```

## Security Configuration

### CORS Settings

CORS settings are configured in `utils/security.py`:

```python
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add additional origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

Rate limiting is configured in `App.py`:

```python
# Rate limiting for specific endpoints
@limiter.limit("100/minute")
@app.post("/api/check-logo/single/")
async def check_logo_single():
    ...

@limiter.limit("60/minute")
@app.post("/api/check-logo/batch/")
async def process_batch_images():
    ...
```

## Cleanup Configuration

Automated cleanup settings are defined in `utils/cleanup.py`:

```python
# Cleanup intervals
scheduler.add_job(cleanup_temp_uploads, 'interval', minutes=30)
scheduler.add_job(cleanup_old_batches, 'interval', hours=1)
scheduler.add_job(cleanup_old_pending_batches, 'interval', hours=24)
```

You can modify these intervals based on your system's needs.

### Cleanup Retention Periods

```python
# Default retention periods
TEMP_FILES_MAX_AGE_MINUTES = 30  # Temporary uploads
BATCH_FILES_MAX_AGE_HOURS = 24   # Regular batch files
PENDING_BATCH_MAX_AGE_HOURS = 72 # Pending batches (3 days)
```

## WebSocket Configuration

WebSocket settings are defined in `utils/ws_manager.py`:

```python
# Timeouts and heartbeat intervals
WEBSOCKET_TIMEOUT_SECONDS = 600  # 10 minutes
HEARTBEAT_INTERVAL_SECONDS = 30  # 30 seconds
```

## Advanced Configuration

### Concurrency Settings

The system uses dynamic concurrency based on CPU cores for batch processing:

```python
# In batch.py or background_tasks.py
MAX_CONCURRENT_REQUESTS = min(4, os.cpu_count() or 1)  # Dynamic based on CPU cores
semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
```

### Memory Optimization

For memory-constrained environments, consider these settings:

```python
# Lower concurrency for memory-constrained environments
MAX_CONCURRENT_REQUESTS = 2

# Increase cleanup frequency
scheduler.add_job(cleanup_temp_uploads, 'interval', minutes=15)
```

### Email Notifications

Email notifications are optional but require valid SMTP settings in the `.env` file to work properly. Configure these parameters to enable email notifications for batch completions. 