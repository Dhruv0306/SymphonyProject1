# Installation Guide

This document provides detailed instructions for installing the Symphony Logo Detection System on your local environment or server.

## System Requirements

- **Python 3.7+** (3.11+ recommended)
- **Node.js 14+** (18+ recommended) for frontend
- **4GB+ RAM** recommended for optimal performance
- **10GB+ Storage** for application, model weights, and temporary files
- **Optional:** GPU with CUDA support for faster model inference

## Backend Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Dhruv0306/SymphonyProject1/
cd usingYolo
```

> **Note:** This project uses Git LFS for large model files. If you want to include model weights in your clone, install Git LFS first with `git lfs install` before cloning.

### 2. Create and Activate a Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate on Windows
.venv\Scripts\activate

# Activate on macOS/Linux
source .venv/bin/activate
```

> **Troubleshooting:** If `python -m venv` fails, try `python3 -m venv` or install the virtual environment package with `pip install virtualenv` and use `virtualenv .venv` instead.

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

For development environments, install additional dependencies:

```bash
pip install -r requirements-dev.txt
```

> **GPU Support:** If you have a compatible NVIDIA GPU, PyTorch will automatically use it if CUDA is properly installed. Check [pytorch.org](https://pytorch.org/get-started/locally/) for custom installation commands if needed.

### 4. Create Necessary Directories

```bash
# Windows
mkdir temp_uploads data exports logs

# macOS/Linux
mkdir -p temp_uploads data exports logs
```

### 5. Environment Configuration

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Then edit the `.env` file with your preferred text editor to configure:

- Admin credentials
- Email settings (optional)
- Security settings
- YOLO service URL (default: http://localhost:8001)

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Frontend Dependencies

```bash
npm install
```

> **Troubleshooting:** If dependency conflicts occur, try `npm install --legacy-peer-deps`

### 3. Configure Backend URL

The frontend needs to know where to find the backend API. You can configure this in three ways:

**Option 1: Using set-backend.js script (recommended)**
```bash
# This will update the configuration and start the development server
npm run start-backend -- --backend=http://your-backend-url:8000
```

**Option 2: Environment variable**
```bash
# Windows
set REACT_APP_BACKEND_URL=http://your-backend-url:8000
npm start

# macOS/Linux
REACT_APP_BACKEND_URL=http://your-backend-url:8000 npm start
```

**Option 3: Edit config.js directly**
Edit `frontend/src/config.js` and update the `API_URL` variable.

## Starting the Application

The system consists of two backend services and a frontend application.

### 1. Start the YOLO Service

In one terminal window:

```bash
# Navigate to the yolo_service directory
cd yolo_service

# Start the service
python start.py
# or for more control:
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Start the Main API

In another terminal window:

```bash
# From the project root directory
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the Frontend

In a third terminal window:

```bash
# From the frontend directory
cd frontend

# Start with default backend URL (http://localhost:8000)
npm run start-backend

# Or with custom backend URL
npm run start-backend -- --backend=http://your-backend-url:8000
```

## Verifying Installation

After starting all components, verify that everything is working:

1. **Frontend:** Access http://localhost:3000 in your browser
2. **API Documentation:** Access http://localhost:8000/docs
3. **YOLO Service:** Access http://localhost:8001/docs

## Common Installation Issues and Solutions

### Backend Issues

1. **Module not found errors**
   - Ensure your virtual environment is activated
   - Try reinstalling dependencies: `pip install -r requirements.txt`

2. **Port already in use**
   - Change the port: `uvicorn App:app --port 8080`
   - Find and terminate the process using the port

3. **Model loading errors**
   - Check that model weights are in the correct location: `runs/detect/*/weights/best.pt`
   - Try downloading models manually and placing in correct paths

### Frontend Issues

1. **Node module errors**
   - Delete `node_modules` and run `npm install` again
   - Try `npm cache clean --force` before reinstalling

2. **API connection errors**
   - Verify backend is running
   - Check CORS settings in backend
   - Verify the backend URL configuration

3. **Missing dependencies**
   - Run `npm install` to ensure all dependencies are installed

## Next Steps

After successful installation:

1. Check out the [Configuration Guide](configuration.md) for customization options
2. Review the [API Reference](api-reference.md) for available endpoints
3. Explore the [Architecture Documentation](architecture.md) to understand the system 