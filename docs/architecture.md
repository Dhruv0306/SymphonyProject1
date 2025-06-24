# System Architecture

This document provides a detailed overview of the Symphony Logo Detection System's architecture.

## High-Level System Overview

The Symphony Logo Detection System is an enterprise-grade platform built with a microservice architecture:

### Core Components
- **React Frontend** (Port 3000): Modern UI with Material-UI components and real-time WebSocket updates
- **FastAPI Main Service** (Port 8000): Primary API with routing, authentication, and batch management
- **YOLO Detection Service** (Port 8001): Dedicated microservice for AI model inference
- **Storage Layer**: File system storage with automated cleanup and retention policies
- **Monitoring**: Comprehensive logging, analytics, and health monitoring

### Technology Stack
- **Backend**: FastAPI 0.115.12, Python 3.7+, Uvicorn ASGI server
- **Frontend**: React 19.1.0, Material-UI 7.1.0, WebSocket client
- **AI/ML**: Ultralytics 8.3.151, PyTorch 2.7.1, OpenCV 4.11.0.86
- **Task Scheduling**: APScheduler 3.10.4 for automated maintenance
- **Rate Limiting**: SlowAPI 0.1.9 for intelligent request throttling

## Security and Rate Limiting

The system implements multi-layered security with intelligent rate limiting:

### Rate Limiting Configuration
- **Single image endpoint**: 150 requests per minute
- **Batch processing endpoint**: 30 requests per minute  
- **CSV export endpoint**: 25 requests per minute
- **Analytics API endpoint**: 50 requests per minute
- **Admin endpoints**: 20 requests per minute

### Security Measures
- **CORS Protection**: Configurable origins with credential support
- **CSRF Protection**: Token-based protection with automatic cleanup
- **Input Validation**: Comprehensive file type and size validation
- **Admin Authentication**: Session-based authentication with configurable duration
- **Request Logging**: Detailed logging of all API requests and responses
- **File Security**: Secure file handling with automatic cleanup

## Model Architecture

The system uses an advanced cascading model approach with 5 specialized YOLO models:

### Sequential Model Processing
1. **yolov8s_logo_detection** (Primary Model)
   - First-line detection with optimized speed
   - Confidence threshold: 0.35
   - Handles majority of common cases

2. **yolov8s_logo_detection2** (Enhanced Model)
   - Secondary YOLOv8s with additional training data
   - Activated when primary model confidence < 0.35
   - Improved accuracy for edge cases

3. **yolov8s_logo_detection3** (Refined Model)
   - Tertiary YOLOv8s with optimized parameters
   - Handles complex detection scenarios
   - Enhanced feature extraction

4. **yolov11s_logo_detection** (Advanced Model)
   - Primary YOLOv11s model with latest architecture
   - Superior accuracy for difficult cases
   - Advanced object detection capabilities

5. **yolov11s3_logo_detection** (Optimized Model)
   - Final YOLOv11s variant with specialized training
   - Highest precision for challenging detections
   - Ensemble-ready architecture

### Processing Optimization
- **Early Return Logic**: Processing stops at first successful detection
- **Image Enhancement**: Automatic 10px white boundary addition
- **Confidence Thresholding**: Configurable threshold (default: 0.35)
- **GPU Acceleration**: CUDA support for faster inference
- **Memory Management**: Efficient model loading and caching

## Batch Processing Flow

The batch processing system follows a comprehensive 4-phase approach:

### Phase 1: Batch Initialization
```
Client → POST /api/start-batch → Generate UUID → Create batch state → Return batch_id
```

### Phase 2: Batch Configuration
```
Client → POST /api/init-batch → Set parameters (client_id, total) → Initialize tracking
```

### Phase 3: Image Processing
```
Client → POST /api/check-logo/batch/ → Validate inputs → Process images → Update progress
```
- Supports both file uploads and URL processing
- Parallel processing with WebSocket progress updates
- Automatic retry logic with exponential backoff
- Chunk-based processing for large batches

### Phase 4: Results & Export
```
Client → GET /api/check-logo/batch/{batch_id}/status → Check progress
Client → GET /api/check-logo/batch/export-csv/{batch_id} → Download results
```

## Data Flow and Storage

### Storage Architecture
```
usingYolo/
├── temp_uploads/     # Temporary processing files (30min cleanup)
├── uploads/          # Persistent uploaded files
├── exports/          # CSV export files (24h retention)
├── data/             # Batch state JSON files (24h retention)
├── logs/             # Application logs (10MB rotation)
└── runs/detect/      # YOLO model weights storage
```

### Data Lifecycle Management
- **Temporary Files**: Cleaned every 30 minutes via APScheduler
- **Batch Data**: 24-hour retention with automatic cleanup
- **Export Files**: 24-hour retention for CSV downloads
- **Log Files**: Size-based rotation (10MB limit)
- **Model Weights**: Persistent storage with version control

## CSV Export Lifecycle

The CSV export system provides comprehensive batch result management:

### Export Process
1. **Request Validation**: Verify batch exists and user permissions
2. **Data Aggregation**: Collect all batch processing results
3. **CSV Generation**: Format data with comprehensive headers
4. **File Creation**: Save to exports/ directory with unique naming
5. **Download Delivery**: Serve file with appropriate headers
6. **Automatic Cleanup**: Schedule removal after 24 hours

### CSV Structure
```csv
Image_Path_or_URL,Is_Valid,Confidence,Detected_By,Bounding_Box,Processing_Time,Timestamp,Batch_ID
logo1.jpg,Valid,0.87,yolov8s_logo_detection,"[120,45,280,180]",0.8,2024-01-15T10:30:00Z,550e8400-e29b-41d4-a716-446655440000
```

## WebSocket Communication

Real-time communication system for batch processing updates:

### Connection Management
- **Endpoint**: `ws://localhost:8000/ws/batch/{batch_id}`
- **Heartbeat**: 30-second ping/pong mechanism
- **Timeout**: 10-minute inactivity timeout
- **Reconnection**: Automatic client-side reconnection logic

### Message Types
- **Progress Updates**: Real-time processing status
- **Error Notifications**: Immediate error reporting
- **Completion Alerts**: Batch completion notifications
- **Heartbeat Messages**: Connection keep-alive

## Error Handling and Monitoring

### Comprehensive Error Management
- **Input Validation Errors**: 400 Bad Request with detailed messages
- **Batch Not Found**: 404 Not Found with batch ID reference
- **Rate Limit Exceeded**: 429 Too Many Requests with retry information
- **Model Failures**: 500 Internal Server Error with error categorization
- **Network Issues**: Automatic retry with exponential backoff

### Monitoring Infrastructure
- **Application Logging**: Structured logging with rotation
- **Performance Metrics**: Processing time and throughput tracking
- **Health Monitoring**: System resource and model status monitoring
- **Admin Dashboard**: Real-time system statistics and batch history
- **Error Tracking**: Categorized error reporting and analysis

## Performance Considerations

### Optimization Strategies
1. **Model Cascade**: Progressive complexity for optimal resource usage
2. **Early Return**: Stop processing at first successful detection
3. **Parallel Processing**: Concurrent batch processing with progress tracking
4. **Intelligent Caching**: Model weight caching and reuse
5. **Resource Management**: Automatic cleanup and memory optimization

### Scalability Features
- **Microservice Architecture**: Separate API and detection services
- **Async Processing**: FastAPI async/await for high concurrency
- **Rate Limiting**: Intelligent throttling to prevent overload
- **Load Balancing Ready**: Stateless design for horizontal scaling
- **Database Agnostic**: File-based storage with easy migration path

## Analytics and Monitoring

### Admin Dashboard Features
- **Real-time Metrics**: Processing statistics and system health
- **Batch History**: Comprehensive batch processing history
- **Model Performance**: Individual model usage and accuracy statistics
- **Resource Utilization**: System resource monitoring and alerts
- **Error Analysis**: Detailed error categorization and trends

### Performance Monitoring
- **API Response Times**: Endpoint-specific performance tracking
- **Model Inference Times**: Individual model performance metrics
- **Resource Consumption**: CPU, memory, and GPU utilization
- **Batch Processing Efficiency**: Throughput and completion rates
- **Error Rates**: Success/failure ratios and error categorization

## Future Enhancements

### Planned Improvements
1. **Enhanced Model Variants**: Additional specialized YOLO models
2. **Advanced Caching**: Redis-based caching for improved performance
3. **Cloud Integration**: AWS/Azure deployment with auto-scaling
4. **Extended Export Formats**: JSON, XML, and custom format support
5. **AI-Assisted Error Correction**: Automatic error detection and correction

### Scalability Roadmap
1. **Kubernetes Deployment**: Container orchestration for production
2. **Distributed Processing**: Multi-node processing capabilities
3. **Database Integration**: PostgreSQL/MongoDB for enhanced data management
4. **Advanced Analytics**: Machine learning-based performance optimization
5. **API Versioning**: Backward-compatible API evolution

## Security Guidelines

### Production Security Checklist
- ✅ Enable HTTPS with valid SSL certificates
- ✅ Implement API key authentication
- ✅ Configure firewall rules for service ports
- ✅ Regular security updates for dependencies
- ✅ Monitor logs for suspicious activity
- ✅ Implement IP whitelisting for admin endpoints
- ✅ Use environment variables for sensitive configuration
- ✅ Regular backup of model weights and configuration

## References

- [API Documentation](./api-reference.md)
- [Getting Started Guide](./getting-started.md)
- [Security Guidelines](./security.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment.md)