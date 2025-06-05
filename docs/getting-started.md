# Getting Started

This guide will help you set up and run the Symphony Logo Detection system.

## System Requirements

- Python 3.7+
- CUDA-compatible GPU (recommended)
- 8GB RAM minimum (16GB recommended)
- 20GB disk space
- Docker (optional)

## Installation Guide

### Standard Installation

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

1. Start the server:
```bash
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

2. Open your browser and navigate to:
- API Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

3. Test with a sample image:
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

## Next Steps

- Read the [API Reference](./api-reference.md)
- Review [Security Guidelines](./security.md)
- Check [Development Guide](./development-guide.md) 