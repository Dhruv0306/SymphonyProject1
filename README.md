# Image Validation Using Logo Detection: By Symphony Limited
## Powered by YOLO Object Detection

This application provides an enterprise-grade solution for detecting Symphony logos in images using multiple YOLOv8 and YOLOv11 models. It features a FastAPI backend for robust image processing and a modern web interface for seamless user interaction.

## Table of Contents
1. [Key Features](#key-features)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [API Documentation](#api-documentation)
8. [Security](#security)
9. [Error Handling](#error-handling)
10. [Logging System](#logging-system)
11. [Development Guidelines](#development-guidelines)
12. [Troubleshooting](#troubleshooting)
13. [Code Examples](#code-examples)
14. [Deployment](#deployment)
15. [License & Support](#license--support)

## Key Features

- **Advanced Multi-Model Detection**
  - Utilizes 5 different YOLO models (YOLOv8s and YOLOv11s variants)
  - Early detection return for optimized performance
  - Configurable confidence threshold (currently set at 0.35)
  - Automatic model fallback for improved accuracy
  - Parallel model execution for faster results

- **Comprehensive Image Processing**
  - Single image validation
  - Batch processing with concurrent execution
  - Support for both file uploads and URLs
  - Automatic image enhancement with boundary addition
  - Robust error handling and validation
  - CSV export functionality with batch tracking
  - Unique batch IDs for parallel processing
  - Timestamped result downloads
  - Support for multiple image formats (JPEG, PNG)

- **Enterprise-Ready API**
  - RESTful FastAPI implementation
  - Comprehensive API documentation (Swagger & ReDoc)
  - Rate limiting and CORS protection
  - WebSocket support for real-time updates
  - Admin authentication and dashboard
  - CSRF protection for secure operations
  - Detailed logging with rotation (10MB limit)
  - Swagger UI integration
  - CSV export endpoint for batch results
  - Health check endpoints
  - Prometheus metrics integration

- **Modern Frontend Interface**
  - React-based user interface (v19.1.0)
  - Material-UI components (v7.1.0)
  - Configurable backend URL
  - Material design components
  - Responsive layout
  - Drag-and-drop file upload
  - Real-time validation feedback via WebSockets
  - Progress tracking for batch operations
  - Admin dashboard with batch history

- **Production-Grade Infrastructure**
  - Thread-safe operations
  - Scheduled tasks with APScheduler
  - Automatic temporary file cleanup (30-minute intervals)
  - Batch data cleanup (24-hour retention)
  - Configurable environment settings
  - Comprehensive error tracking
  - Performance optimization features
  - Secure file handling for exports
  - File-based caching with cleanup
  - Detailed logging with rotation

## System Architecture

### High-Level System Overview
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Client Layer"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["Web Interface"] -->|"HTTP/REST"| B["FastAPI Backend"]
    end

    subgraph "Application Layer"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style X fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Request Handling"| C["Request Router"]
        C -->|"Rate Limiting"| D["SlowAPI Limiter"]
        D -->|"Validation"| E["Input Validator"]
        E -->|"Processing"| F["Image Processor"]
        C -->|"Batch Operations"| X["Batch Manager"]
    end

    subgraph "Model Layer"
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        F -->|"Model Selection"| G["Model Manager"]
        G -->|"Inference"| H["YOLOv8s Models"]
        G -->|"Inference"| I["YOLOv11s Models"]
        H -->|"Results"| J["Result Aggregator"]
        I -->|"Results"| J
        X -->|"Batch Processing"| G
    end

    subgraph "Storage Layer" 
        style K fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style N fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        F -->|"Save"| K["Temporary Storage"]
        B -->|"Logs"| M["Log Files"]
        X -->|"State"| N["Batch State Store"]
    end
```

### Authentication & API Security Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Client Request"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A[Client Request] -->|"HTTP/REST"| B[API Gateway]
        B -->|"Process"| C[Request Handler]
    end

    subgraph "Security Layers"
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style G fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"Check"| D[Rate Limiter]
        D -->|"Verify"| E[CORS Filter]
        E -->|"Scan"| F[Input Validator]
        F -->|"Process"| G[Request Handler]
    end

    subgraph "Protection Measures"
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        G -->|"Apply"| H[XSS Protection]
        G -->|"Verify"| I[CSRF Token]
        G -->|"Check"| J[Resource Limits]
    end

    subgraph "Monitoring & Logging"
        style K fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style L fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        H & I & J -->|"Log"| K[Security Logs]
        K -->|"Alert"| L[Security Monitor]
    end
```

### Frontend-to-Backend Interaction Map
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph LR
    subgraph "Frontend Components"
        style A1 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A3 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A4 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A1[Upload Component] -->|"Files"| B1[API Client]
        A2[URL Input] -->|"URLs"| B1
        A3[Batch Manager] -->|"Batch ID"| B1
        A4[Progress Tracker] -->|"Status"| B1
    end

    subgraph "API Layer"
        style B1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B3 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B4 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B1 -->|"Request"| B2[FastAPI Routes]
        B2 -->|"Rate Limit"| B3[Request Handler]
        B3 -->|"Process"| B4[YOLO Models]
    end

    subgraph "State Management"
        style C1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style C2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style C3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        B3 -->|"Update"| C1[UI State]
        C1 -->|"Reflect"| C2[Progress Bar]
        C1 -->|"Update"| C3[Batch Status]
    end

    subgraph "User Feedback"
        style D1 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style D2 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style D3 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        C1 -->|"Show"| D1[Status Messages]
        C1 -->|"Display"| D2[Results Grid]
        C1 -->|"Export"| D3[CSV Download]
    end
```

### Model Fallback Logic Flow
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Initial Processing"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A[Image Input] -->|"Process"| B[YOLOv8s Model #1]
    end

    subgraph "Confidence Check"
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Check"| C{Confidence > 0.35?}
        C -->|"Yes"| D[Return Result]
    end

    subgraph "Model Cascade"
        style E fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"No"| E[YOLOv8s Model #2]
        E -->|"Check"| F{Confidence > 0.35?}
        F -->|"No"| G[YOLOv8s Model #3]
        G -->|"Check"| H{Confidence > 0.35?}
        H -->|"No"| I[YOLOv11s Models]
    end

    subgraph "Final Processing"
        style J fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style K fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        I -->|"Parallel"| J[Ensemble Processing]
        J -->|"Aggregate"| K[Final Decision]
    end

    F -->|"Yes"| D
    H -->|"Yes"| D
    K -->|"Result"| D
```

### Batch Processing Pipeline
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold', 'messageFontWeight': 'bold', 'noteFontWeight': 'bold'}}}%%
sequenceDiagram
    participant C as "Client"
    participant A as "API Gateway"
    participant B as "Batch Manager"
    participant V as "Validator"
    participant P as "Processor"
    participant M as "Model Pool"
    participant E as "CSV Exporter"
    participant S as "Storage"

    rect rgba(40, 100, 160, 0.4)
        C->>A: "Start Batch"
        A->>B: "Initialize Batch"
        B->>S: "Create Batch State"
        B-->>C: "Return Batch ID"
    end

    rect rgba(40, 100, 160, 0.4)
        C->>A: "Submit Images (with Batch ID)"
    end
    
    rect rgba(30, 90, 50, 0.4)
        A->>A: "Authenticate"
        A->>B: "Validate Batch ID"
        A->>V: "Validate Request"
    end
    
    rect rgba(90, 50, 100, 0.4)
        V->>P: "Process Image"
        
        par "Image Processing"
            P->>P: "Enhance Image"
            P->>P: "Add Boundaries"
            P->>P: "Normalize"
        end
    end
    
    rect rgba(130, 90, 20, 0.4) 
        P->>M: "Request Detection"
        
        par "Model Processing"
            M->>M: "YOLOv8s #1"
            M->>M: "YOLOv8s #2"
            M->>M: "YOLOv11s #1"
            M->>M: "YOLOv11s #2"
            M->>M: "YOLOv11s #3"
        end
    end
    
    rect rgba(120, 40, 50, 0.4)
        M->>P: "Return Results"
        P->>B: "Update Batch State"
        P->>S: "Cache Results"
        P->>A: "Aggregate Response"
        A->>C: "Return Response"
    end

    rect rgba(60, 80, 110, 0.4)
        Note over C,S: "CSV Export Flow"
        C->>A: "Request CSV Export (with Batch ID)"
        A->>B: "Validate Batch ID"
        B->>E: "Fetch Batch Results"
        E->>S: "Get Cached Results"
        S-->>E: "Return Results"
        E->>E: "Generate CSV"
        Note right of E: "Add Batch ID"
        E->>S: "Store CSV File"
        S-->>A: "File Location"
        A-->>C: "Download CSV"
        Note over S: "Cleanup Temporary Files"
    end
```

### Model Architecture
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Input Processing" 
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A[Raw Image] -->|Preprocessing| B[Enhanced Image]
        B -->|Normalization| C[Normalized Image]
        C -->|Batching| D[Image Batch]
    end

    subgraph "Model Pool Manager" 
        style E fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style J1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style J2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style J3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        D -->|Distribution| E[Load Balancer]
        E -->|Route| F[Model Selection]
        
        F -->|High Confidence| G[YOLOv8s Pool]
        F -->|Complex Cases| H[YOLOv11s Pool]
        
        subgraph "YOLOv8s Models"
            G -->|Instance 1| I1[YOLOv8s #1]
            G -->|Instance 2| I2[YOLOv8s #2]
        end
        
        subgraph "YOLOv11s Models"
            H -->|Instance 1| J1[YOLOv11s #1]
            H -->|Instance 2| J2[YOLOv11s #2]
            H -->|Instance 3| J3[YOLOv11s #3]
        end
    end

    subgraph "Result Processing" 
        style K fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style L fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style N fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        I1 & I2 & J1 & J2 & J3 -->|Results| K[Result Collector]
        K -->|Aggregation| L[Confidence Checker]
        L -->|Threshold Check| M[Decision Maker]
        M -->|Final Result| N[Response Generator]
    end
```

### Error Handling and Monitoring
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph LR
    subgraph "Error Sources"
        style A1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A3 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A4 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        A1["Input Validation"] -->|"Errors"| B["Error Handler"]
        A2["Processing"] -->|"Errors"| B
        A3["Model Inference"] -->|"Errors"| B
        A4["System"] -->|"Errors"| B
    end

    subgraph "Error Processing"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Classification"| C["Error Classifier"]
        C -->|"Response"| D["Error Response"]
    end

    subgraph "Monitoring"
        style E fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Logs"| F["Log Files"]
        F -->|"Analysis"| E["Log Analysis"]
    end

    subgraph "Error Reporting"
        style H fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        E -->|"Report"| H["Error Reports"]
    end
```

### Data Flow and Storage
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Input Sources"
        style A1 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A1["File Upload"] -->|"Process"| B["Data Processor"]
        A2["URL Input"] -->|"Process"| B
    end

    subgraph "Processing"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Validate"| C["Data Validator"]
        C -->|"Transform"| D["Data Transformer"]
    end

    subgraph "Storage"
        style E fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        D -->|"Cache"| E["File Cache"]
        D -->|"Persist"| F["File System"]
        D -->|"Export"| G["CSV Export"]
    end

    subgraph "Cleanup"
        style H fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        E -->|"Scheduled"| H["Cache Cleanup"]
        F -->|"Scheduled"| I["File Cleanup"]
    end
```

### CSV Export Lifecycle
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
sequenceDiagram
    participant C as Client
    participant A as API
    participant B as Batch Manager
    participant D as Data Processor
    participant S as Storage
    participant E as Exporter

    rect rgba(40, 100, 160, 0.4)
        C->>A: Request CSV Export
        A->>B: Validate Batch ID
        B->>D: Fetch Batch Results
    end

    rect rgba(30, 90, 50, 0.4)
        D->>S: Get Cached Results
        S-->>D: Return Results
        D->>E: Format Data
    end

    rect rgba(90, 50, 100, 0.4)
        E->>E: Generate Headers
        E->>E: Format Rows
        E->>E: Add Metadata
    end

    rect rgba(120, 40, 50, 0.4)
        E->>S: Save CSV File
        S-->>A: Return File Path
        A-->>C: Download Link
    end

    rect rgba(60, 80, 110, 0.4)
        Note over S: Auto-cleanup after 24h
        Note over C: Secure Download
        Note over E: Include Batch Details
    end
```

## Technology Stack

### Backend Infrastructure
- FastAPI 0.115.12 (async support)
- Python 3.7+
- Ultralytics 8.3.151 (YOLOv8 and YOLOv11)
- Pillow 11.2.1 for image processing
- APScheduler 3.10.4 for scheduled tasks
- SlowAPI 0.1.9 for rate limiting
- File-based caching and state management
- Rotating file logs
- uvicorn 0.34.3 for ASGI server

### Frontend Stack
- React 19.1.0
- Material-UI 7.1.0
- Axios 1.9.0 for API calls
- React Dropzone 14.3.8
- Cross-env 7.0.3 for environment management
- Jest for testing
- ESLint for code quality

### AI/ML Components
- 5 specialized YOLO models
  - 2x YOLOv8s instances
  - 3x YOLOv11s instances
- Custom confidence thresholds (0.35)
- Model ensemble approach
- Optimized inference pipeline
- GPU acceleration support

### Development Tools
- Poetry for dependency management
- Pre-commit hooks
- Pytest for backend testing
- Jest for frontend testing
- Black for Python formatting
- ESLint for JavaScript/TypeScript

## Installation

### System Requirements

- Python 3.7+ with pip
- Node.js 14+ with npm
- 4GB+ RAM recommended for model inference
- GPU support optional but recommended for faster processing

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/Dhruv0306/SymphonyProject1.git
cd usingYolo
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create necessary directories:
```bash
mkdir -p temp_uploads data
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure the backend URL:
```bash
# Using npm start-backend script with custom backend
npm run start-backend -- --backend=http://your-backend-url:8000

# Or using default backend (http://localhost:8000)
npm run start-backend
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=False

# Model Configuration
CONFIDENCE_THRESHOLD=0.35
ENABLE_GPU=True
MAX_BATCH_SIZE=50

# Security
CORS_ORIGINS=["http://localhost:3000"]
RATE_LIMIT=100

# Logging
LOG_LEVEL=INFO
LOG_ROTATION=10MB
```

### Frontend Configuration

The frontend configuration is managed through environment variables and the `set-backend.js` script:

```javascript
// set-backend.js usage:
npm run start-backend -- --backend=http://your-backend-url:8000 --port=3000 --host=0.0.0.0

// Parameters:
// --backend=<url>  : Set custom backend URL (default: http://localhost:8000)
// --port=<port>    : Set custom frontend port (default: 3000)
// --host=<host>    : Set custom host IP (default: localhost)
```

### Model Configuration

The YOLO models are configured in `detect_logo.py`:

```python
MODEL_PATHS = [
    'runs/detect/yolov8s_logo_detection/weights/best.pt',    # YOLOv8s model trained on logo dataset
    'runs/detect/yolov8s_logo_detection2/weights/best.pt',   # Second iteration with additional data
    'runs/detect/yolov8s_logo_detection3/weights/best.pt',   # Third iteration with refined data
    'runs/detect/yolov11s_logo_detection/weights/best.pt',   # YOLOv11s model for comparison
    'runs/detect/yolov11s3_logo_detection/weights/best.pt'   # YOLOv11s with optimized parameters
]

CONFIDENCE_THRESHOLD = 0.35  # Minimum confidence threshold for logo detection
```

## Running the Application

1. Start the FastAPI backend:
```bash
# From the project root directory
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

2. Start the React frontend:
```bash
# From the frontend directory
npm run start-backend
```

3. Access the application:
- Web Interface: http://localhost:3000
- API Documentation: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

### Development Mode

For development, you can run both the backend and frontend with hot-reloading:

1. Backend (with auto-reload):
```bash
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

2. Frontend (with custom backend URL):
```bash
cd frontend
npm run start-backend -- --backend=http://localhost:8000 --port=3000
```

### Production Mode

For production deployment:

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Run the backend with production settings:
```bash
uvicorn App:app --host 0.0.0.0 --port 8000 --workers 4
```

### API Documentation

The application provides built-in documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Documentation

### Main Endpoints

#### 1. Logo Detection Endpoints

##### Start Batch Session
```http
POST /api/start-batch

Response:
{
    "batch_id": "uuid-string"
}
```

##### Single Image Validation
```http
POST /api/check-logo/single/
Content-Type: multipart/form-data

Parameters:
- file: Image file (required if image_path not provided)
- image_path: Image URL (required if file not provided)

Response:
{
    "Image_Path_or_URL": string,
    "Is_Valid": "Valid" | "Invalid",
    "Confidence": float | null,
    "Detected_By": string | null,
    "Bounding_Box": {
        "x1": int,
        "y1": int,
        "x2": int,
        "y2": int
    } | null,
    "Error": string | null
}
```

##### Batch Processing
```http
POST /api/check-logo/batch/
Content-Type: multipart/form-data

Parameters:
- batch_id: UUID for batch tracking (required)
- files: Array of image files (required if paths not provided)
- paths: Array of image URLs (required if files not provided)

Response:
{
    "batch_id": string,
    "total_processed": int,
    "valid_count": int,
    "invalid_count": int,
    "results": [
        {
            "Image_Path_or_URL": string,
            "Is_Valid": "Valid" | "Invalid",
            "Confidence": float | null,
            "Detected_By": string | null,
            "Bounding_Box": object | null,
            "Error": string | null
        }
    ]
}
```

#### 2. Utility Endpoints

##### Export Batch Results
```http
GET /api/check-logo/batch/export-csv
Parameters:
- batch_id: string (required)

Response: CSV file
```

##### Get Batch Status
```http
GET /api/check-logo/batch/getCount
Parameters:
- batch_id: string (required)

Response:
{
    "valid": number,
    "invalid": number,
    "total": number
}
```

#### 3. Admin Endpoints

```http
POST /api/admin/login
Parameters:
- username: string (required)
- password: string (required)

Response:
{
    "access_token": string,
    "token_type": "bearer"
}
```

```http
GET /api/admin/batch-history
Headers:
- Authorization: Bearer <token>

Response:
{
    "batches": [
        {
            "batch_id": string,
            "timestamp": string,
            "total_processed": int,
            "valid_count": int,
            "invalid_count": int
        }
    ]
}
```

#### 4. WebSocket Endpoint

```
WebSocket /ws/batch/{batch_id}

Purpose: Real-time batch processing updates
```

#### 5. Status Endpoints

```http
GET /
Response: Redirects to API documentation

GET /api
Response: API summary information
```

### Rate Limiting

The API implements rate limiting:
- Single image endpoint: 100 requests per minute
- Batch processing endpoint: 20 requests per minute

### Error Responses

All endpoints follow a consistent error response format:

```json
{
    "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request (invalid input)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## Security

### Authentication and Authorization
- Admin authentication with token-based security
- CSRF protection with token validation
- Rate limiting with SlowAPI
- CORS protection for cross-origin requests
- Detailed logging with rotation
- Secure file handling for uploads and exports
- File-based state management
- Input validation and sanitization

### Data Protection
- Secure file uploads and downloads
- Data encryption in transit and at rest
- Access control and permissions

### Error Handling and Monitoring
- Comprehensive error tracking and logging
- Alerting and notification mechanisms
- Automated error detection and response

## Error Handling

### Common Errors
- Input validation errors
- Model inference errors
- System-level errors

### Error Handling Strategy
- Automated error classification
- Human intervention for critical errors
- Detailed logging and monitoring

## Logging System

### Logging Levels
- INFO, WARNING, ERROR, CRITICAL

### Logging Sources
- FastAPI backend
- Frontend interactions
- Model inference
- System-level events
- Security events
- Batch processing events
- Scheduled task execution

### Log Management
- Rotating file logs with 10MB size limit
- Structured logging format
- Automatic cleanup of old log files

## Development Guidelines

### Code Quality
- PEP 8 compliance
- Code readability and maintainability
- Automated testing

### Documentation
- Comprehensive API documentation
- Code comments and docstrings
- Developer guidelines

## Troubleshooting

### Common Issues
- Model inference errors
- API connectivity issues
- Data processing delays
- WebSocket connection failures
- CORS-related issues
- Rate limiting restrictions

### Troubleshooting Steps
- Check system logs at `logs/app.log`
- Verify API connectivity with health check endpoint
- Ensure model files exist in the correct paths
- Check for proper CORS configuration
- Verify WebSocket connections
- Re-run the inference pipeline

## Code Examples

Here are examples demonstrating how to use the API:

```python
# Example: Using the API to check a single image
import requests

def check_single_image(image_path, api_url="http://localhost:8000"):
    """Check a single image for Symphony logo."""
    endpoint = f"{api_url}/api/check-logo/single/"
    
    # For file upload
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(endpoint, files=files)
    
    # Process response
    if response.status_code == 200:
        result = response.json()
        print(f"Image: {result['Image_Path_or_URL']}")
        print(f"Valid Logo: {result['Is_Valid'] == 'Valid'}")
        if result['Confidence']:
            print(f"Confidence: {result['Confidence']:.2f}")
        if result['Detected_By']:
            print(f"Detected By: {result['Detected_By']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

# Example: Batch processing with URLs
def process_batch_urls(url_list, api_url="http://localhost:8000"):
    """Process multiple images via URLs."""
    # Start a batch session
    start_response = requests.post(f"{api_url}/api/start-batch")
    batch_id = start_response.json()["batch_id"]
    
    # Submit URLs for processing
    batch_data = {
        "image_paths": url_list,
        "batch_id": batch_id
    }
    
    response = requests.post(
        f"{api_url}/api/check-logo/batch/",
        json=batch_data,
        headers={"Content-Type": "application/json"}
    )
    
    return response.json()
```

```javascript
// Example: Frontend API client for batch processing
const processBatchImages = async (files, batchSize = 10) => {
  try {
    // Start a batch session
    const batchResponse = await axios.post(`${API_BASE_URL}/api/start-batch`);
    const batchId = batchResponse.data.batch_id;
    
    // Prepare form data
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('batch_id', batchId);
    
    // Process the batch
    const response = await axios.post(
      `${API_BASE_URL}/api/check-logo/batch/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error processing batch:', error);
    throw error;
  }
};
```

## Deployment

### Server Deployment

For production deployment, follow these steps:

1. Set up a server with Python 3.7+ and Node.js 14+
2. Clone the repository and install dependencies
3. Build the frontend as described in the Production Mode section
4. Configure environment variables for production settings
5. Use a process manager like PM2 or Supervisor to manage the application
6. Set up a reverse proxy with Nginx or Apache
7. Configure SSL/TLS for secure connections

### Environment Configuration

For production environments, ensure these settings are properly configured:
- Set DEBUG_MODE=False
- Configure appropriate CORS_ORIGINS
- Set proper rate limits
- Enable logging with appropriate rotation settings

## License & Support

### License
- Apache License 2.0

### Support
- Email support
- Community forums
- Documentation and tutorials 