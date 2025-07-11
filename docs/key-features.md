# Key Features

Symphony Logo Detection System offers a comprehensive set of enterprise-grade features designed for advanced image validation, high-throughput processing, and robust administration.

## End-User Features

### Advanced Multi-Model Detection

The system leverages a cascade of 6 specialized YOLO models for maximum accuracy and performance:

- `yolov8s_logo_detection` (primary)
- `yolov8s_logo_detection2` (enhanced)
- `yolov8s_logo_detection3` (refined)
- `yolov11s_logo_detection` (advanced)
- `yolov11s3_logo_detection` (optimized)
- `yolov11s_cooler_detection` (cooler dataset specialized)

**Key Aspects:**
- Early detection return when logo is found (performance optimization)
- Configurable confidence threshold (default: 0.35)
- Model cascade approach for maximum accuracy
- Automatic image enhancement with boundary addition
- Support for local files and URL-based images
- Support for JPEG, PNG, WEBP, BMP, and other common formats

### Real-Time Image Processing

- Single image validation via file upload or URL
- Batch processing with unique session tracking (1-100 images)
- Smart Zip Processing: Automatic zip file creation for batches >300 images
- Batch uploads sent in a single request (or zipped if large); all chunking and retry logic is handled server-side
- Real-time progress and per-file status delivered via WebSocket
- Automatic image preprocessing and enhancement with white boundary addition
- Enhanced image preview for uploads and URLs with better scaling, status badges, and captions
- Improved state management for batch and preview modes
- Improved overflow handling in preview containers for a cleaner UI
- Upload status indicators (uploading, validating, valid, invalid, error)
- Batch results are fetched after completion via a dedicated endpoint

### Export & Reporting

- CSV export with batch metadata and timestamps
- Comprehensive result details (confidence, bounding boxes, model used)
- Processing time statistics and batch summaries
- Email Notifications: Automated batch completion alerts with summary statistics
- Download results with detailed detection information
- Batch Analytics: Processing metrics including average time per image
- Error Reporting: Detailed error tracking and categorization in exports

### Modern User Interface

- React 19.1.0 with latest features and optimizations
- Material-UI 7.1.0 for professional design components
- Enhanced File Upload: Multi-method support (drag-drop, file picker, URL input)
- Smart Preview System: Grid-based image previews with status indicators
- Improved ProgressBar: Real-time progress with processing speed, success rate, and connection status
- Responsive design for desktop and mobile devices
- Symphony branding with consistent color scheme (#0066B3)
- Mobile-first responsive design with drawer navigation
- Real-time Progress: WebSocket-powered progress bars with detailed metrics
- Simplified Upload: The frontend uploads all files/URLs in a single request (or as a zip if >300 files)
- Client-side routing with React Router DOM 6.30.1

## Admin Features

### Secure Authentication & Access Control

- Admin authentication with session management
- Secure login with configurable session duration
- Role-based access to administrative functions
- CSRF protection and security middleware

### Enhanced Dashboard & Analytics

- Advanced Admin Dashboard with batch history viewing
- Enhanced Error Handling with connection recovery and retry mechanisms
- Improved Status Tracking with detailed progress messages and alerts
- Client ID Integration for proper WebSocket communication
- Batch Tracking Initialization for server-side progress monitoring
- Professional UI/UX with Material-UI alerts and better visual feedback
- Batch history management and monitoring
- Processing statistics and performance metrics
- System health monitoring and status tracking
- Real-time batch progress monitoring across all users

### Batch Management

- Complete batch history with detailed metadata
- Batch status tracking and lifecycle management
- Export capabilities for administrative reporting
- User activity monitoring and audit trails

## System Features

### Enterprise Security

- Rate limiting with SlowAPI (configurable per endpoint)
- CORS middleware for cross-origin requests
- CSRF protection and security middleware
- Secure session management with configurable duration
- Input validation and sanitization

### Production-Grade Infrastructure

- FastAPI with automatic OpenAPI documentation
- Async/await architecture for high performance
- APScheduler for automated maintenance tasks
- WebSocket endpoints for real-time batch updates
- RESTful endpoints for all operations
- Configurable backend URL via environment scripts (`set-backend.js`)

### Comprehensive Logging & Monitoring

- Structured logging with automatic rotation (10MB limit)
- Detailed error tracking and categorization
- Performance monitoring and metrics collection
- WebSocket connection management with timeout handling
- Real-time system health monitoring
- Enhanced Connection Recovery with exponential backoff and retry mechanisms

### Automated Resource Management

- Automatic cleanup of temporary files (30-minute cycles)
- Batch data retention with configurable expiry (24 hours)
- Environment-based configuration management
- Memory and storage optimization
- Automated maintenance and housekeeping tasks
- Smart Cleanup Protection for pending batches (3-day retention)

### Scalability & Performance

- Microservice Architecture: Decoupled Main API (App.py) and YOLO Service (yolo_service/)
- Service Communication: services/yolo_client.py handles inter-service communication with retry logic
- Independent Scaling: YOLO service can be scaled separately from main API
- Advanced Batch Processing: All chunking and retry logic is handled server-side
- Smart Resource Management: Dynamic concurrent request limiting based on CPU cores
- Zip File Optimization: Automatic compression for large batches (>300 files)
- Efficient Model Loading: Cached model weights in runs/detect/ directories
- Optimized Pipeline: Streamlined image processing with utils/file_ops.py
- Server-Side Processing: Progress and results are handled via WebSocket and batch completion polling
- Load Balancing Ready: Stateless architecture with external state management
- WebSocket progress events are batch-aware, ensuring only relevant updates are shown for the current batch

### Batch Recovery and Resilience

- Automatic Recovery: System scans for incomplete batches on startup and resumes processing
- Pending State Tracking: Uses `pending_{batch_id}.json` files in exports directory to track unprocessed URLs and files
- Resilient Processing: Interrupted or failed batch processes are automatically resumed from pending URLs/files
- Reliability Enhancement: Improves system reliability for large or long-running batch jobs
- Progress Preservation: Maintains processing state across application restarts with pending URL/file tracking
- Fixed Duplicate Progress Tracking: Eliminated duplicate progress increments in batch retry logic for accurate progress reporting 