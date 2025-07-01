# Getting Started

This guide will help you set up and run the Symphony Logo Detection System from initial installation to first successful batch processing.

## System Overview

Before diving into installation, understand what you're setting up:

### What is the Symphony Logo Detection System?
An enterprise-grade platform that uses 5 sequential YOLO models to detect Symphony logos in images with high accuracy. The system features:

- **Supported Image Formats**: JPG, JPEG, PNG, WEBP, BMP
- **Microservice Architecture**: Main API (port 8000) + YOLO Detection Service (port 8001)
- **Modern Frontend**: React 19.1.0 with Material-UI components and real-time updates
- **Batch Processing**: Handle 1-999 images per batch with automatic retry logic
- **Admin Dashboard**: Comprehensive analytics and batch management
- **Automated Operations**: Self-managing cleanup and resource optimization

### Architecture Quick Reference
- [High-Level System Overview](./architecture.md#high-level-system-overview)
- [Model Architecture Details](./architecture.md#model-architecture)
- [Batch Processing Flow](./architecture.md#batch-processing-flow)
- [Complete Architecture Guide](./architecture.md)

## System Requirements

### Minimum Requirements
| Component | Requirement | Notes |
|-----------|-------------|-------|
| **OS** | Windows 10+, macOS 10.15+, Ubuntu 18.04+ | 64-bit required |
| **Python** | 3.7+ | 3.8+ recommended |
| **Node.js** | 14+ | 16+ recommended |
| **RAM** | 4GB | 8GB+ recommended for batch processing |
| **Storage** | 20GB free space | SSD recommended |
| **Network** | Stable internet | Required for URL processing |

### Recommended Configuration
| Component | Recommendation | Benefit |
|-----------|----------------|---------|
| **CPU** | 8 cores, 3.0GHz+ | Faster batch processing |
| **RAM** | 16GB+ | Better performance with large batches |
| **GPU** | CUDA-compatible, 4GB+ VRAM | Accelerated AI inference |
| **Storage** | SSD, 50GB+ free | Faster file operations |
| **Network** | High-speed broadband | Optimal URL processing |

## Pre-Installation Checklist

Before starting installation, verify:

- ✅ **Ports Available**: 8000 (API), 8001 (YOLO Service), 3000 (Frontend)
- ✅ **Python Version**: `python --version` shows 3.7+
- ✅ **Node.js Version**: `node --version` shows 14+
- ✅ **Git Installed**: For cloning the repository
- ✅ **Admin Rights**: For installing dependencies (if needed)
- ✅ **Internet Access**: For downloading dependencies and URL processing

## Installation Guide

### Step 1: Repository Setup

```bash
# Clone the repository
git clone https://github.com/Dhruv0306/SymphonyProject1/
cd usingYolo

# Verify project structure
ls -la  # Should show App.py, frontend/, yolo_service/, etc.
```

### Step 2: Backend Installation

#### Create Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Verify activation (should show (.venv) in prompt)
which python  # Should point to .venv/bin/python
```

> **Troubleshooting**: If `python -m venv` fails, try `python3 -m venv` or install `python3-venv` package on Ubuntu.

#### Install Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify key packages
pip list | grep -E "(fastapi|ultralytics|torch)"
```

> **Troubleshooting**: If PyTorch installation fails, visit [pytorch.org](https://pytorch.org) for platform-specific installation commands.

#### Create Required Directories
```bash
# Create necessary directories
mkdir -p temp_uploads data exports logs  # macOS/Linux
mkdir temp_uploads data exports logs     # Windows

# Verify directory creation
ls -la | grep -E "(temp_uploads|data|exports|logs)"
```

### Step 3: Frontend Installation

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Verify installation
npm list react react-dom @mui/material
```

> **Troubleshooting**: If `npm install` fails, try `npm install --legacy-peer-deps` or delete `node_modules/` and retry.

### Step 4: Environment Configuration

#### Create .env File
```bash
# Create .env file in project root (not in frontend/)
cd ..  # Make sure you're in usingYolo/ root
touch .env  # macOS/Linux
type nul > .env  # Windows
```

#### Configure Environment Variables
```env
# Required Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Optional Configuration (with defaults)
CONFIDENCE_THRESHOLD=0.35
SESSION_DURATION=1800
YOLO_SERVICE_URL=http://localhost:8001

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@company.com
SMTP_PASSWORD=your_app_password
SENDER_EMAIL=your_email@company.com
SENDER_NAME=Symphony Logo Detection
```

> **Security Note**: Use a strong admin password (12+ characters, mixed case, numbers, symbols).

## Running the Application

### First Run Checklist

Before starting services, verify:

- ✅ Virtual environment activated (`(.venv)` in prompt)
- ✅ Dependencies installed (`pip list` shows required packages)
- ✅ `.env` file created with admin credentials
- ✅ Required directories exist (`temp_uploads/`, `data/`, etc.)
- ✅ Ports 8000, 8001, 3000 are available

### Start Services (3 Terminals Required)

> **Important**: All three services must be running for the system to function properly.

#### Terminal 1: Main API Service
```bash
# From project root (usingYolo/)
# Ensure virtual environment is activated
uvicorn App:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# INFO: Uvicorn running on http://0.0.0.0:8000
# INFO: Application startup complete
```

#### Terminal 2: YOLO Detection Service
```bash
# From project root, navigate to yolo_service
cd yolo_service

# Start YOLO detection service
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Expected output:
# INFO: Uvicorn running on http://0.0.0.0:8001
# INFO: Models loaded successfully
```

#### Terminal 3: Frontend Service
```bash
# From frontend directory
cd frontend

# Start React frontend with backend configuration
npm run start-backend

# Expected output:
# Local: http://localhost:3000
# Backend configured: http://localhost:8000
```

### Verify Installation

#### Check Service Health
```bash
# Test API service
curl http://localhost:8000/api
# Should return API endpoint documentation

# Test YOLO service
curl http://localhost:8001/health
# Should return service health status

# Test frontend
# Open browser to http://localhost:3000
# Should show Symphony Logo Detection interface
```

#### Access Points
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **Admin Dashboard**: http://localhost:3000/admin (use credentials from .env)

## Quick Start Tutorial

### Single Image Test

1. **Open Web Interface**: Navigate to http://localhost:3000
2. **Upload Test Image**: Use drag-and-drop or click to select an image (JPG, JPEG, PNG, WEBP, BMP)
3. **Process Image**: Click "Validate Image" button
4. **View Results**: See detection results with confidence score and bounding box

### Batch Processing Test

1. **Switch to Batch Mode**: Toggle "Batch Processing" switch
2. **Upload Multiple Images**: Select 2-5 test images (JPG, JPEG, PNG, WEBP, BMP)
3. **Start Processing**: Click "Start Batch Processing"
4. **Monitor Progress**: Watch real-time progress updates
5. **Download Results**: Click "Download CSV" when complete

### Admin Dashboard Test

1. **Access Admin**: Navigate to http://localhost:3000/admin
2. **Login**: Use credentials from .env file
3. **View Dashboard**: Explore batch history and system statistics
4. **Check Analytics**: Review processing metrics and model performance

## Configuration Options

### Custom Host/Port Configuration

#### Backend Services
```bash
# Custom host for both services (must match)
uvicorn App:app --reload --host 192.168.1.100 --port 8000
uvicorn main:app --reload --host 192.168.1.100 --port 8001  # In yolo_service/
```

#### Frontend Configuration
```bash
# Custom backend URL and frontend port
npm run start-backend -- --backend=http://192.168.1.100:8000 --port=3001 --host=0.0.0.0

# Available parameters:
# --backend=<url>  : Custom backend URL (default: http://localhost:8000)
# --port=<port>    : Custom frontend port (default: 3000)
# --host=<host>    : Custom host IP (default: localhost)
```

### Model Configuration

The system automatically loads 5 YOLO models from:
```
runs/detect/
├── yolov8s_logo_detection/weights/best.pt
├── yolov8s_logo_detection2/weights/best.pt
├── yolov8s_logo_detection3/weights/best.pt
├── yolov11s_logo_detection/weights/best.pt
└── yolov11s3_logo_detection/weights/best.pt
```

> **Note**: Model weights should be present for the system to function. Contact your system administrator if models are missing.

## Troubleshooting

### Common Issues and Solutions

#### "Port already in use" Error
```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process if needed
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### "Module not found" Error
```bash
# Verify virtual environment is activated
which python  # Should point to .venv

# Reinstall dependencies
pip install -r requirements.txt

# Check specific package
pip show fastapi ultralytics
```

#### Frontend Won't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:8000/api

# Check CORS configuration in App.py
# Verify frontend backend URL configuration
```

#### Models Not Loading
```bash
# Check model files exist
ls -la runs/detect/*/weights/best.pt

# Check file permissions
chmod 644 runs/detect/*/weights/best.pt  # macOS/Linux

# Verify YOLO service logs for model loading errors
```

### Performance Issues

#### Slow Processing
- **Check GPU**: Verify CUDA installation if using GPU
- **Monitor Resources**: Use Task Manager/Activity Monitor
- **Reduce Batch Size**: Process fewer images per batch
- **Check Network**: Verify internet speed for URL processing

#### High Memory Usage
- **Restart Services**: Restart all three services periodically
- **Check Log Files**: Monitor log file sizes in `logs/`
- **Clear Temp Files**: Manually clean `temp_uploads/` if needed

### Getting Help

#### Log Files
Check these locations for detailed error information:
- **Application Logs**: `logs/app.log`
- **Error Logs**: `logs/error.log`
- **Console Output**: Terminal output from each service

#### System Health
- **API Health**: http://localhost:8000/api
- **Service Status**: Check all three terminal windows for errors
- **Resource Usage**: Monitor CPU, RAM, and disk usage

#### Support Channels
- **Internal IT**: inter.it@symphonylimited.com
- **Documentation**: Comprehensive guides in `docs/` directory
- **API Reference**: http://localhost:8000/docs for interactive testing

## Next Steps

Once installation is complete:

1. **Review Architecture**: Read [System Architecture](./architecture.md) for deeper understanding
2. **Explore API**: Use [API Reference](./api-reference.md) for integration
3. **Security Setup**: Review [Security Guidelines](./security.md) for production
4. **Development**: Check [Development Guide](./development-guide.md) for customization

## Production Considerations

### Before Production Deployment
- ✅ Change default admin credentials
- ✅ Configure HTTPS with SSL certificates
- ✅ Set up reverse proxy (nginx/Apache)
- ✅ Configure firewall rules
- ✅ Set up monitoring and alerting
- ✅ Plan backup and recovery procedures
- ✅ Review security guidelines

### Performance Optimization
- Use production WSGI server (Gunicorn)
- Configure multiple workers
- Set up load balancing
- Implement caching strategies
- Monitor and tune resource usage

For detailed production deployment guidance, see [Deployment Guide](./deployment.md).