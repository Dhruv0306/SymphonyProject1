# Getting Started

This guide will help you set up and run the Symphony Logo Detection system.

## System Requirements

- Python 3.7+
- CUDA-compatible GPU (recommended)
- 8GB RAM minimum (16GB recommended)
- 20GB disk space
- Docker (optional)
- Node.js 14+ (for frontend)

## System Overview

Before diving into installation, you might want to understand the system architecture:

- [High-Level System Overview](./architecture.md#high-level-system-overview)
- [Processing Pipeline](./architecture.md#detailed-processing-pipeline)
- [Data Flow](./architecture.md#data-flow-and-storage)

For a complete architectural overview, see our [Architecture Documentation](./architecture.md).

## Installation Guide

### Backend Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd usingYolo
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend with a custom backend URL:
```bash
# Using npm start-backend script
npm run start-backend --backend=http://your-backend-url:8000

# Or using default backend (http://localhost:8000)
npm run start-backend
```

### Docker Installation

1. Build the image:
```bash
docker build -t symphony-logo-detection .
```

2. Run the container:
```bash
docker run -p 8000:8000 -v $(pwd)/data:/app/data symphony-logo-detection
```

## Quick Start Tutorial

1. Start the backend server:
```bash
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

2. Start the frontend (in a separate terminal):
```bash
cd frontend
npm run start-backend
```

3. Open your browser and navigate to:
- Frontend UI: http://localhost:3000
- API Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

4. Test with a sample image:
```bash
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.jpg"
```

## Environment Setup

1. Create a `.env` file:
```env
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=False
CONFIDENCE_THRESHOLD=0.35
```

2. Configure logging:
```env
LOG_LEVEL=INFO
LOG_ROTATION=10MB
```

3. Set security parameters:
```env
API_KEY_HEADER=X-API-Key
CORS_ORIGINS=["http://localhost:3000"]
RATE_LIMIT=100
```

## System Components

Our system consists of several key components:

1. **Frontend Layer**
   - React-based UI
   - Configurable backend URL
   - Modern material design
   - Responsive interface

2. **Model Layer**
   - Multiple YOLO models for detection
   - See [Model Architecture](./architecture.md#model-architecture)

3. **Processing Pipeline**
   - Image processing and enhancement
   - Batch processing capabilities
   - CSV export functionality
   - See [Processing Pipeline](./architecture.md#detailed-processing-pipeline)

4. **Error Handling**
   - Comprehensive error management
   - Monitoring and logging
   - See [Error Handling](./architecture.md#error-handling-and-monitoring)

## Next Steps

- Review the [System Architecture](./architecture.md)
- Read the [API Reference](./api-reference.md)
- Review [Security Guidelines](./security.md)
- Check [Development Guide](./development-guide.md) 