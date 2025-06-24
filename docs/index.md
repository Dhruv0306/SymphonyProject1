# Symphony Logo Detection System
## Enterprise-Grade YOLO-Powered Image Validation Platform

Welcome to the official documentation for Symphony Limited's Logo Detection System. This enterprise-grade solution provides comprehensive logo detection capabilities using advanced YOLO-based machine learning models with real-time processing and batch management.

## System Overview

The Symphony Logo Detection System is a production-ready platform that combines cutting-edge AI technology with enterprise-grade infrastructure:

### 🎯 Core Capabilities
- **Advanced AI Detection**: 5 sequential YOLO models (YOLOv8s and YOLOv11s variants)
- **Real-Time Processing**: WebSocket-based progress tracking and updates
- **Batch Management**: Scalable processing of 1-999 images per batch
- **Enterprise Integration**: RESTful API with comprehensive admin controls
- **Automated Operations**: Self-managing cleanup and resource optimization

### 🏗️ Architecture Highlights
- **Microservice Design**: Separate API (port 8000) and detection service (port 8001)
- **Modern Frontend**: React 19.1.0 with Material-UI 7.1.0 components
- **Intelligent Rate Limiting**: SlowAPI with endpoint-specific throttling
- **Comprehensive Monitoring**: Real-time analytics and performance tracking

## Table of Contents

1. **[Getting Started](./getting-started.md)**
   - System Requirements & Installation
   - Quick Start Tutorial
   - Environment Configuration
   - First Run Checklist

2. **[System Architecture](./architecture.md)**
   - [High-Level System Overview](./architecture.md#high-level-system-overview)
   - [Model Architecture](./architecture.md#model-architecture)
   - [Batch Processing Flow](./architecture.md#batch-processing-flow)
   - [Data Flow and Storage](./architecture.md#data-flow-and-storage)
   - [WebSocket Communication](./architecture.md#websocket-communication)
   - [Error Handling and Monitoring](./architecture.md#error-handling-and-monitoring)

3. **[API Reference](./api-reference.md)**
   - RESTful API Endpoints
   - Request/Response Formats
   - Authentication & Rate Limiting
   - WebSocket Documentation
   - Error Codes & Handling
   - Model Architecture Details

4. **[Detection Features](./detection-features.md)**
   - Single Image Validation
   - Batch Processing Capabilities
   - URL-based Detection
   - Sequential Model Testing
   - Confidence Thresholds
   - CSV Export Functionality

5. **[Admin Dashboard](./admin-dashboard.md)**
   - Authentication System
   - Batch History Management
   - System Analytics
   - Performance Monitoring
   - User Management

6. **[Security & Compliance](./security.md)**
   - Input Validation & Sanitization
   - File Security Measures
   - CORS Configuration
   - Rate Limiting Strategies
   - Admin Access Controls
   - Compliance Guidelines

7. **[Development Guide](./development-guide.md)**
   - Development Environment Setup
   - Code Standards & Best Practices
   - Testing Procedures
   - CI/CD Pipeline
   - Contributing Guidelines

8. **[Production Deployment](./deployment.md)**
   - Deployment Strategies
   - Performance Optimization
   - Monitoring & Maintenance
   - Scaling Considerations
   - Update Procedures

## Key Features

### 🤖 Advanced AI Detection Engine
- **5 Sequential YOLO Models**:
  - `yolov8s_logo_detection` - Primary detection model
  - `yolov8s_logo_detection2` - Enhanced variant with additional training
  - `yolov8s_logo_detection3` - Refined parameters for edge cases
  - `yolov11s_logo_detection` - Advanced YOLOv11s architecture
  - `yolov11s3_logo_detection` - Optimized YOLOv11s variant

- **Intelligent Processing**:
  - Early return optimization (stops at first successful detection)
  - Configurable confidence threshold (default: 0.35)
  - Automatic image enhancement with boundary addition
  - GPU acceleration support for faster inference

### 🚀 Enterprise Integration
- **RESTful API Architecture**:
  - FastAPI 0.115.12 with automatic OpenAPI documentation
  - Async/await processing for high concurrency
  - Comprehensive error handling and logging
  - Rate limiting with intelligent throttling

- **Real-Time Communication**:
  - WebSocket endpoints for live progress updates
  - Heartbeat mechanism with automatic reconnection
  - Batch processing status notifications
  - Error reporting and recovery

### 💻 Modern User Interface
- **React 19.1.0 Frontend**:
  - Material-UI 7.1.0 professional components
  - Responsive design for desktop and mobile
  - Drag-and-drop file upload with React Dropzone
  - Real-time progress tracking with WebSocket integration

- **Admin Dashboard**:
  - Secure authentication with session management
  - Comprehensive batch history and analytics
  - System performance monitoring
  - User activity tracking and audit trails

### 📊 Batch Processing & Analytics
- **Scalable Batch Operations**:
  - Process 1-999 images per batch
  - Support for both file uploads and URL processing
  - Automatic retry logic with exponential backoff
  - Chunk-based processing for large datasets

- **Comprehensive Analytics**:
  - Real-time processing statistics
  - Model performance metrics
  - Resource utilization monitoring
  - Detailed error analysis and reporting

### 🛡️ Production-Grade Security
- **Multi-Layer Security**:
  - CORS protection with configurable origins
  - CSRF protection with token management
  - Input validation and sanitization
  - Secure file handling and storage

- **Rate Limiting & Monitoring**:
  - Endpoint-specific rate limits
  - Intelligent throttling algorithms
  - Comprehensive request logging
  - Performance monitoring and alerting

### 🔧 Automated Operations
- **Resource Management**:
  - APScheduler for automated maintenance tasks
  - Automatic cleanup of temporary files (30-minute cycles)
  - Batch data retention with configurable expiry (24 hours)
  - Log rotation with size-based management (10MB limit)

- **Health Monitoring**:
  - System resource monitoring
  - Model performance tracking
  - Error rate analysis
  - Automated alerting and recovery

## Quick Start

### Prerequisites
- Python 3.7+ with virtual environment
- Node.js 14+ for frontend development
- 4GB+ RAM (8GB recommended)
- Optional: CUDA-compatible GPU for acceleration

### Installation
```bash
# Clone repository
git clone https://github.com/Dhruv0306/SymphonyProject1/
cd usingYolo

# Backend setup
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
```

### Running the System
```bash
# Terminal 1: Main API Service
uvicorn App:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: YOLO Detection Service
cd yolo_service
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Terminal 3: Frontend
cd frontend
npm run start-backend
```

### Access Points
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Admin Dashboard**: http://localhost:3000/admin

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores, 2.5GHz
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB available space
- **Network**: Stable internet connection for URL processing
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Recommended Configuration
- **CPU**: 8 cores, 3.0GHz+
- **RAM**: 16GB+
- **GPU**: CUDA-compatible GPU with 4GB+ VRAM
- **Storage**: SSD with 50GB+ available space
- **Network**: High-speed internet for optimal performance

## Support and Resources

### Documentation
- **API Documentation**: [Interactive Swagger UI](http://localhost:8000/docs)
- **System Architecture**: [Detailed Architecture Guide](./architecture.md)
- **Getting Started**: [Installation & Setup Guide](./getting-started.md)
- **Security Guidelines**: [Security Best Practices](./security.md)

### Technical Support
- **Email**: inter.it@symphonylimited.com
- **Internal Support**: Symphony Limited IT Department
- **Documentation Updates**: Regular updates with system releases
- **Issue Reporting**: Through organizational channels

### Additional Resources
- **Model Performance**: Real-time metrics via admin dashboard
- **System Health**: Monitoring endpoints and alerts
- **Batch Analytics**: Comprehensive processing statistics
- **Error Analysis**: Detailed error categorization and resolution

## License and Compliance

### Copyright
Copyright © 2024 Symphony Limited. All rights reserved.

### Usage Rights
This system is proprietary software developed for Symphony Limited's internal use. All usage must comply with organizational policies and guidelines.

### Compliance
- Data processing complies with organizational data policies
- Security measures meet enterprise security standards
- Audit trails maintained for compliance reporting
- Regular security assessments and updates

### Contact
For licensing inquiries and compliance questions:
- **Legal Department**: legal@symphonylimited.com
- **IT Department**: inter.it@symphonylimited.com
- **Project Lead**: Development team contact through organizational channels

---

**Symphony Logo Detection System** - Powered by advanced YOLO technology for enterprise-grade logo validation and brand compliance automation.