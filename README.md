**Symphony Logo Detection System: Enterprise-grade, real-time image validation using advanced YOLO models for brand compliance and automated QA.**

![Python](https://img.shields.io/badge/Python-3.7%2B-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

# Symphony Logo Detection System
## Enterprise-Grade YOLO-Powered Image Validation

### Executive Summary
Symphony Logo Detection System is an enterprise-grade platform for automated, high-accuracy logo validation in images, designed for scalable batch processing and real-time feedback. The system leverages advanced YOLO AI models to deliver reliable logo detection for quality assurance, brand compliance, and automated content validation workflows. Built for Symphony Limited, it provides both single-image validation and high-throughput batch processing capabilities with comprehensive admin controls and real-time progress monitoring.

A comprehensive logo detection system built by Symphony Limited that uses advanced YOLOv8 and YOLOv11 models to validate the presence of Symphony logos in images. The system features a robust FastAPI backend with real-time processing capabilities and a modern React 19.1.0 frontend for seamless user interaction.

---

## Table of Contents
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
  - [High-Level System Overview](#high-level-system-overview)
  - [FastAPI Application Architecture](#fastapi-application-architecture-apppy)
  - [React Frontend Component Architecture](#react-frontend-component-architecture)
  - [Sequential Model Processing Flow](#sequential-model-processing-flow-detect_logopy)
  - [Batch Processing Pipeline](#batch-processing-pipeline)
  - [YOLO Model Detection Pipeline](#yolo-model-detection-pipeline)
  - [Error Handling and Monitoring](#error-handling-and-monitoring)
  - [File Storage and Cleanup System](#file-storage-and-cleanup-system)
  - [CSV Export Lifecycle](#csv-export-lifecycle)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Installation](#installation)
  - [System Requirements](#system-requirements)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Frontend Configuration](#frontend-configuration)
  - [Backend Configuration](#backend-configuration)
  - [Model Configuration](#model-configuration)
- [Running the Application](#running-the-application)
  - [Quick Start](#quick-start-1)
  - [Custom Configuration](#custom-configuration)
  - [WebSocket Configuration](#websocket-configuration)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [API Documentation](#api-documentation)
  - [Main Endpoints](#main-endpoints)
- [Security](#security)
- [Error Handling](#error-handling)
- [Logging System](#logging-system)
- [Testing](#testing)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [License & Support](#license--support)
  - [License](#license)
  - [Support & Contact](#support--contact)
  - [Contributing](#contributing)
  - [Acknowledgments](#acknowledgments)

---

## Key Features

### 🎯 End-User Features

- **📸 Advanced Multi-Model Detection**
  - 5 specialized YOLO models with sequential processing:
    - `yolov8s_logo_detection` (primary)
    - `yolov8s_logo_detection2` (enhanced)
    - `yolov8s_logo_detection3` (refined)
    - `yolov11s_logo_detection` (advanced)
    - `yolov11s3_logo_detection` (optimized)
  - Early detection return when logo is found (performance optimization)
  - Configurable confidence threshold (default: 0.35)
  - Model cascade approach for maximum accuracy
  - Automatic image enhancement with boundary addition
  - Support for both local files and URL-based images

- **⚡ Real-Time Image Processing**
  - Single image validation via file upload or URL
  - Batch processing with unique session tracking (1-999 images)
  - Real-time WebSocket updates for batch progress
  - Automatic image preprocessing and enhancement
  - Support for JPEG, PNG, and other common formats
  - Concurrent processing for improved performance
  - Upload status indicators (uploading, validating, valid, invalid, error)
  - Chunked upload processing with retry logic for failed batches

- **📊 Export & Reporting**
  - CSV export with batch metadata and timestamps
  - Comprehensive result details (confidence, bounding boxes, model used)
  - Processing time statistics and batch summaries
  - Email notification input for batch completion alerts
  - Download results with detailed detection information

- **💻 Modern User Interface**
  - React 19.1.0 with latest features and optimizations
  - Material-UI 7.1.0 for professional design components
  - Drag-and-drop file upload with React Dropzone 14.3.8
  - Responsive design for desktop and mobile devices
  - Symphony branding with consistent color scheme (#0066B3)
  - Mobile-first responsive design with drawer navigation
  - Client-side routing with React Router DOM 6.30.1

### 👨‍💼 Admin Features

- **🔐 Secure Authentication & Access Control**
  - Admin authentication with session management
  - Secure login with configurable session duration
  - Role-based access to administrative functions
  - CSRF protection and security middleware

- **📈 Dashboard & Analytics**
  - Comprehensive admin dashboard for system overview
  - Batch history management and monitoring
  - Processing statistics and performance metrics
  - System health monitoring and status tracking
  - Real-time batch progress monitoring across all users

- **📋 Batch Management**
  - Complete batch history with detailed metadata
  - Batch status tracking and lifecycle management
  - Export capabilities for administrative reporting
  - User activity monitoring and audit trails

### 🛡️ System Features

- **🔒 Enterprise Security**
  - Rate limiting with SlowAPI (configurable per endpoint)
  - CORS middleware for cross-origin requests
  - CSRF protection and security middleware
  - Secure session management with configurable duration
  - Input validation and sanitization

- **⚙️ Production-Grade Infrastructure**
  - FastAPI with automatic OpenAPI documentation
  - Async/await architecture for high performance
  - APScheduler for automated maintenance tasks
  - WebSocket endpoints for real-time batch updates
  - RESTful endpoints for all operations
  - Configurable backend URL via environment scripts (`set-backend.js`)

- **📝 Comprehensive Logging & Monitoring**
  - Structured logging with automatic rotation (10MB limit)
  - Detailed error tracking and categorization
  - Performance monitoring and metrics collection
  - WebSocket connection management with timeout handling
  - Real-time system health monitoring

- **🧹 Automated Resource Management**
  - Automatic cleanup of temporary files (30-minute cycles)
  - Batch data retention with configurable expiry (24 hours)
  - Environment-based configuration management
  - Memory and storage optimization
  - Automated maintenance and housekeeping tasks

- **🚀 Scalability & Performance**
  - **Microservice Architecture**: Decoupled Main API (App.py) and YOLO Service (yolo_service/)
  - **Service Communication**: services/yolo_client.py handles inter-service communication
  - **Independent Scaling**: YOLO service can be scaled separately from main API
  - **Concurrent Processing**: Batch processing with progress tracking via utils/batch_tracker.py
  - **Efficient Model Loading**: Cached model weights in runs/detect/ directories
  - **Optimized Pipeline**: Streamlined image processing with utils/file_ops.py
  - **Load Balancing Ready**: Stateless architecture with external state management

---

## System Architecture

### High-Level System Overview

This diagram illustrates the complete system architecture showing how the React frontend (port 3000) communicates with the FastAPI backend (port 8000), which routes requests through specialized modules to the core YOLO detection engine. The system includes utility services for batch tracking, WebSocket management, security, and automated cleanup, with persistent storage for temporary files, exports, logs, and batch data.

<details>
<summary><strong>📊 System Architecture Diagram</strong> (Click to expand)</summary>

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Frontend Layer"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A1 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["React Frontend<br/>Port 3000"] -->|"Render Components"| A1["FileUploader Component<br/>Batch processing UI"]
        A -->|"Admin Access"| A2["Admin Dashboard<br/>Authentication required"]
        A1 -->|"API Calls + WebSocket"| B["FastAPI App.py<br/>Port 8000"]
        A2 -->|"Auth Requests"| B
    end

    subgraph "API Router Layer (routers/)"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C3 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C4 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C5 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C6 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C7 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Route Single Images"| C1["routers/single.py<br/>POST /api/check-logo/single"]
        B -->|"Route Batch Requests"| C2["routers/batch.py<br/>POST /api/start-batch<br/>POST /api/init-batch<br/>POST /api/check-logo/batch/"]
        B -->|"Route CSV Exports"| C3["routers/export.py<br/>GET /api/check-logo/batch/export-csv/{id}"]
        B -->|"Route Admin Auth"| C4["routers/admin_auth.py<br/>POST /api/admin/login"]
        B -->|"Route WebSocket"| C5["routers/websocket.py<br/>WS /ws/{client_id}"]
        B -->|"Route Dashboard"| C6["routers/dashboard_stats.py<br/>GET /api/admin/dashboard"]
        B -->|"Route Batch History"| C7["routers/batch_history.py<br/>GET /api/admin/batch-history"]
    end

    subgraph "Microservice Detection Engine"
        style D fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E4 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E5 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C1 -->|"Call check_logo()"| D["detect_logo.py<br/>Sequential model testing<br/>Confidence threshold 0.35"]
        C2 -->|"Call check_logo()"| D
        D -->|"Via services/yolo_client.py"| D2["yolo_service/<br/>Microservice Architecture<br/>main.py + start.py"]
        D2 -->|"Load Model 1"| E1["runs/detect/yolov8s_logo_detection/<br/>weights/best.pt"]
        D2 -->|"Load Model 2"| E2["runs/detect/yolov8s_logo_detection2/<br/>weights/best.pt"]
        D2 -->|"Load Model 3"| E3["runs/detect/yolov8s_logo_detection3/<br/>weights/best.pt"]
        D2 -->|"Load Model 4"| E4["runs/detect/yolov11s_logo_detection/<br/>weights/best.pt"]
        D2 -->|"Load Model 5"| E5["runs/detect/yolov11s3_logo_detection/<br/>weights/best.pt"]
    end

    subgraph "Utility Services (utils/)"
        style F1 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F2 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F3 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F4 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F5 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F6 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F7 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Track Batch State"| F1["utils/batch_tracker.py<br/>JSON state management<br/>24h retention"]
        B -->|"Manage WebSocket"| F2["utils/ws_manager.py<br/>Real-time progress updates<br/>Client connections"]
        B -->|"Schedule Cleanup"| F3["utils/cleanup.py<br/>APScheduler tasks<br/>Resource management"]
        B -->|"Apply Security"| F4["utils/security.py<br/>CORS, rate limiting<br/>SlowAPI integration"]
        B -->|"Write Logs"| F5["utils/logger.py<br/>Structured logging<br/>10MB rotation"]
        B -->|"File Operations"| F6["utils/file_ops.py<br/>File handling utilities"]
        B -->|"Background Tasks"| F7["utils/background_tasks.py<br/>Async task management"]
    end

    subgraph "Storage & Data"
        style G1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style G2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style G3 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style G4 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        D -->|"Save Temp Files"| G1["temp_uploads/<br/>Processing artifacts<br/>30min cleanup"]
        C3 -->|"Generate CSV"| G2["exports/<br/>batch_{id}_results.csv<br/>24h retention"]
        F5 -->|"Write Log Files"| G3["logs/<br/>Application & error logs<br/>Size-based rotation"]
        F1 -->|"Store Batch Data"| G4["data/<br/>{batch_id}.json<br/>State persistence"]
    end

    subgraph "Testing & Quality (tests/)"
        style H1 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000000,font-weight:bold
        style H2 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000000,font-weight:bold
        style H3 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000000,font-weight:bold
        C2 -->|"Test Coverage"| H1["tests/test_batch.py<br/>tests/test_single.py<br/>tests/test_detect_logo.py"]
        H1 -->|"Frontend Tests"| H2["frontend/src/__tests__/<br/>React component testing<br/>Jest + React Testing Library"]
        H1 -->|"Test Config"| H3["tests/pytest.ini<br/>Test configuration<br/>Coverage reporting"]
    end
```

**Fallback Description:** The system consists of a React Frontend (port 3000) connecting to FastAPI App.py (port 8000) through API Router Layer (routers/ directory with single.py, batch.py, export.py, admin_auth.py, websocket.py, dashboard_stats.py, batch_history.py). The Microservice Detection Engine uses detect_logo.py with services/yolo_client.py connecting to yolo_service/ microservice, loading 5 YOLO models from runs/detect/ directories. Utility Services (utils/ directory) include batch_tracker.py, ws_manager.py, cleanup.py, security.py, logger.py, file_ops.py, and background_tasks.py. Storage & Data layer manages temp_uploads/, exports/, logs/, and data/ directories. Testing & Quality includes tests/ directory with pytest configuration and frontend/src/__tests__/ for React components.

</details>

### FastAPI Application Architecture (App.py)

This diagram shows the internal structure of the FastAPI application, detailing the middleware stack (CORS, rate limiting, CSRF protection, admin authentication), API router layer, validation and processing flow, startup tasks with APScheduler, and core endpoints. It demonstrates how requests flow through security layers before reaching the detection logic.

<details>
<summary><strong>⚙️ FastAPI Architecture Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Client Layer"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A1 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["React Frontend"] -->|"HTTP/REST + WebSocket"| A1["FastAPI App.py"]
    end

    subgraph "Security & Rate Limiting"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        A1 -->|"Apply Middleware"| B["CORS Middleware"]
        B -->|"Rate Limit"| C["SlowAPI Limiter"]
        C -->|"CSRF Protection"| D["Security Utils"]
        D -->|"Session Auth"| E["Admin Authentication"]
    end

    subgraph "API Router Layer"
        style F1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F4 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F5 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        E -->|"Route"| F1["single.py Router<br/>POST /api/check-logo/single"]
        E -->|"Route"| F2["batch.py Router<br/>POST /api/start-batch<br/>POST /api/init-batch<br/>POST /api/check-logo/batch/<br/>GET /api/check-logo/batch/{id}/status"]
        E -->|"Route"| F3["export.py Router<br/>GET /api/check-logo/batch/export-csv/{id}"]
        E -->|"Route"| F4["admin_auth.py Router<br/>POST /api/admin/login<br/>POST /api/admin/logout"]
        E -->|"Route"| F5["websocket.py Router<br/>WS /ws/{client_id}"]
    end

    subgraph "Validation & Processing"
        style G fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        F1 & F2 -->|"Validate Input"| G["File Operations<br/>- Multipart files<br/>- Image URLs<br/>- File type validation"]
        G -->|"Process Images"| H["detect_logo.py<br/>- Sequential model testing<br/>- Confidence threshold 0.35<br/>- 5 YOLO models"]
        H -->|"Log Results"| I["Logger Utils<br/>- Batch tracking<br/>- Error handling"]
    end

    subgraph "Startup & Background Tasks"
        style J1 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style J2 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style J3 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style J4 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        A1 -->|"@app.on_event('startup')"| J1["APScheduler Initialization"]
        J1 -->|"Schedule Job"| J2["Cleanup Jobs (1hr intervals)"]
        J1 -->|"Schedule Job"| J3["CSRF Token Cleanup (15min)"]
        J1 -->|"Create Task"| J4["WebSocket Monitor (30s)"]
    end

    subgraph "Core Endpoints"
        style K1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style K2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style K3 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        A1 -->|"@app.get('/')"| K1["GET / → RedirectResponse(/docs)"]
        A1 -->|"@app.get('/api')"| K2["GET /api → API Documentation"]
        A1 -->|"@app.websocket()"| K3["WebSocket /ws/batch/{batch_id}"]
    end
```

**Fallback Description:** FastAPI App.py receives requests from React Frontend and applies middleware layers: CORS Middleware → SlowAPI Limiter → Security Utils → Admin Authentication. Requests are routed through API Router Layer (single.py, batch.py, export.py, admin_auth.py, websocket.py) to Validation & Processing (File Operations → detect_logo.py → Logger Utils). Startup & Background Tasks include APScheduler initialization with cleanup jobs, CSRF token cleanup, and WebSocket monitoring. Core Endpoints provide GET /, GET /api, and WebSocket /ws/batch/{batch_id}.

</details>

### React Frontend Component Architecture

This diagram illustrates the React frontend's component hierarchy, showing how the main App.js initializes routing through router.js and AppNavigation.js. It details the core upload components (FileUploader.js, BatchProcessingForm.js, ProgressBar.js, EmailInput.js), admin components (AdminLogin.js, Dashboard.js, BatchHistory.js), utility services, and backend communication flow.

<details>
<summary><strong>⚙️ React Frontend Architecture Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Main App Structure"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["App.js<br/>Main React application<br/>Port 3000"] -->|"Initialize Routes"| B["router.js<br/>React Router setup<br/>Route definitions"]
        B -->|"Render Navigation"| C["AppNavigation.js<br/>Navigation component<br/>Route switching"]
    end

    subgraph "Core Upload Components"
        style D1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D3 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D4 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"Route to Upload"| D1["FileUploader.js<br/>Main upload interface<br/>Batch processing UI"]
        D1 -->|"Render Batch Form"| D2["BatchProcessingForm.js<br/>Multi-file upload<br/>URL input support"]
        D1 -->|"Show Progress"| D3["ProgressBar.js<br/>Real-time progress<br/>WebSocket updates"]
        D1 -->|"Collect Email"| D4["EmailInput.js<br/>User identification<br/>Notification setup"]
    end

    subgraph "Admin Components"
        style E1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E4 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"Route to Admin"| E1["AdminLogin.js<br/>Authentication form<br/>Session management"]
        E1 -->|"Authenticate & Redirect"| E2["Dashboard.js<br/>Admin control panel<br/>System overview"]
        E2 -->|"Display History"| E3["BatchHistory.js<br/>Processing history<br/>Batch management"]
        C -->|"Show Admin Link"| E4["AdminNavLink.js<br/>Conditional navigation<br/>Auth-based visibility"]
    end

    subgraph "Utility Services"
        style F1 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F2 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F3 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        D1 -->|"Chunk Images"| F1["utils/imageChunker.js<br/>File processing<br/>Batch optimization"]
        D1 -->|"Generate Client ID"| F2["utils/clientId.js<br/>Unique identification<br/>Session tracking"]
        E1 -->|"Handle Auth"| F3["utils/auth.js<br/>Authentication logic<br/>Token management"]
    end

    subgraph "Backend Communication"
        style G1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style G2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style G3 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        F1 -->|"Get API Endpoints"| G1["config.js<br/>API URLs configuration<br/>Environment settings"]
        D3 -->|"Real-time Updates"| G2["WebSocket Connection<br/>ws://localhost:8000/ws/{client_id}<br/>Progress notifications"]
        G1 -->|"API Calls"| G3["FastAPI Backend<br/>http://localhost:8000<br/>REST API endpoints"]
    end

    subgraph "State Flow"
        style H1 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000000,font-weight:bold
        style H2 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000000,font-weight:bold
        style H3 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000000,font-weight:bold
        D2 -->|"1. Start Batch"| H1["POST /api/start-batch<br/>Get batch_id"]
        H1 -->|"2. Initialize"| H2["POST /api/init-batch<br/>Set parameters"]
        H2 -->|"3. Process"| H3["POST /api/check-logo/batch/<br/>Upload & process files"]
    end
```

**Fallback Description:** React App.js (port 3000) initializes routes through router.js and renders AppNavigation.js. Core Upload Components include FileUploader.js (main interface), BatchProcessingForm.js (multi-file upload), ProgressBar.js (real-time progress), and EmailInput.js (notifications). Admin Components provide AdminLogin.js (authentication), Dashboard.js (control panel), BatchHistory.js (processing history), and AdminNavLink.js (conditional navigation). Utility Services handle imageChunker.js (file processing), clientId.js (unique identification), and auth.js (authentication logic). Backend Communication uses config.js (API configuration), WebSocket connections (ws://localhost:8000/ws/{client_id}), and FastAPI Backend (http://localhost:8000). State Flow: Start Batch → Initialize → Process files.

</details>

### Sequential Model Processing Flow (detect_logo.py)

This diagram demonstrates the core AI detection logic, showing how images (files or URLs) are processed through PIL Image processing with white boundary addition, then sequentially tested against 5 YOLO models with early return optimization. It illustrates the decision flow and result structure for both successful detections and error handling.

<details>
<summary><strong>🤖 AI Model Processing Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Image Input Processing"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["File Upload or URL"] -->|"Image.open() / requests.get()"| B["PIL Image Processing"]
        B -->|"ImageOps.expand(border=10, fill='white')"| C["Add White Boundary"]
    end

    subgraph "Sequential Model Execution (detect_logo.py)"
        style D1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D4 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D5 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"model.predict(conf=0.35)"| D1["Model 1: yolov8s_logo_detection<br/>Confidence ≥ 0.35"]
        D1 -->|"No Symphony Detected"| D2["Model 2: yolov8s_logo_detection2<br/>Confidence ≥ 0.35"]
        D2 -->|"No Symphony Detected"| D3["Model 3: yolov8s_logo_detection3<br/>Confidence ≥ 0.35"]
        D3 -->|"No Symphony Detected"| D4["Model 4: yolov11s_logo_detection<br/>Confidence ≥ 0.35"]
        D4 -->|"No Symphony Detected"| D5["Model 5: yolov11s3_logo_detection<br/>Confidence ≥ 0.35"]
    end

    subgraph "Early Return Logic"
        style E1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        D1 -->|"Symphony Found (Conf ≥ 0.35)"| E1["Return Valid Result<br/>Stop processing other models"]
        D2 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D3 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D4 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D5 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D5 -->|"No Symphony in All Models"| E2["Return Invalid<br/>All models failed"]
    end

    subgraph "Result Structure"
        style F fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        E1 -->|"Format JSON Response"| F["JSON Response:<br/>- Image_Path_or_URL<br/>- Is_Valid: 'Valid'/'Invalid'<br/>- Confidence (if valid)<br/>- Detected_By (model name)<br/>- Bounding_Box [x1,y1,x2,y2]<br/>- Error (if processing failed)"]
        E2 -->|"Format JSON Response"| F
    end

    subgraph "Error Handling"
        style G fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        A -->|"Invalid file/URL"| G["Error Response<br/>- Is_Valid: 'Invalid'<br/>- Error: description<br/>- No confidence/bounding box"]
        G --> F
    end
```

**Fallback Description:** Image Input Processing: File Upload or URL → PIL Image Processing → Add White Boundary (10px). Sequential Model Execution: Model 1 (yolov8s_logo_detection) → Model 2 (yolov8s_logo_detection2) → Model 3 (yolov8s_logo_detection3) → Model 4 (yolov11s_logo_detection) → Model 5 (yolov11s3_logo_detection), each with confidence ≥ 0.35. Early Return Logic: If Symphony found (Conf ≥ 0.35) → Return Valid Result and stop processing; if no Symphony in all models → Return Invalid. Result Structure: JSON Response with Image_Path_or_URL, Is_Valid, Confidence, Detected_By, Bounding_Box, Error. Error Handling: Invalid file/URL → Error Response with no confidence/bounding box.

</details>

### Batch Processing Pipeline

This sequence diagram shows the complete batch processing workflow from initialization to completion. It demonstrates the 4-step process: batch initialization, parameter setting, image processing with model testing, and status checking with CSV export. The diagram illustrates the interaction between Client, FastAPI App, batch router, tracker, detection logic, YOLO models, and file storage.

<details>
<summary><strong>🔄 Batch Processing Sequence Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold', 'messageFontWeight': 'bold', 'noteFontWeight': 'bold'}}}%%
sequenceDiagram
    participant C as "Client"
    participant A as "FastAPI App"
    participant B as "batch.py Router"
    participant T as "batch_tracker.py"
    participant D as "detect_logo.py"
    participant M as "YOLO Models"
    participant S as "File Storage"

    rect rgba(40, 100, 160, 0.6)
        Note over C,A: "Step 1: Initialize Batch"
        C->>A: "POST /api/start-batch"
        A->>B: "create_batch_id()"
        B->>T: "initialize_batch()"
        T->>S: "Create batch state in data/"
        B-->>C: "201: {batch_id: uuid}"
    end

    rect rgba(40, 100, 160, 0.6)
        Note over C,A: "Step 2: Set Batch Parameters"
        C->>A: "POST /api/init-batch"
        Note right of C: "{batch_id, client_id, total}"
        A->>B: "init_batch_processing()"
        B->>T: "update_batch_state()"
        B-->>C: "200: Batch initialized"
    end
    
    rect rgba(30, 90, 50, 0.6)
        Note over C,A: "Step 3: Process Images"
        C->>A: "POST /api/check-logo/batch/"
        Note right of C: "files[] + batch_id OR image_paths[] + batch_id"
        A->>B: "process_batch_images()"
        B->>B: "Validate batch_id exists"
        B->>B: "Validate files or URLs provided"
    end
    
    rect rgba(90, 50, 100, 0.6)
        loop "For each image"
            B->>D: "check_logo(image)"
            D->>D: "Add white boundary"
            D->>D: "Preprocess image"
            
            alt "Sequential Model Testing"
                D->>M: "yolov8s_logo_detection.predict()"
                alt "No logo detected (conf < 0.35)"
                    D->>M: "yolov8s_logo_detection2.predict()"
                    alt "No logo detected"
                        D->>M: "yolov8s_logo_detection3.predict()"
                        alt "No logo detected"
                            D->>M: "yolov11s_logo_detection.predict()"
                            alt "No logo detected"
                                D->>M: "yolov11s3_logo_detection.predict()"
                            end
                        end
                    end
                end
            end
            
            M-->>D: "Detection results"
            D-->>B: "Formatted response"
            B->>T: "update_batch_progress()"
        end
    end
    
    rect rgba(120, 40, 50, 0.6)
        B->>T: "finalize_batch_state()"
        T->>S: "Save final results"
        B-->>C: "200: {batch_id, message, status: 'processing'}"
    end

    rect rgba(60, 80, 110, 0.6)
        Note over C,S: "Step 4: Check Status & Export"
        C->>A: "GET /api/check-logo/batch/{batch_id}/status"
        A->>B: "get_batch_status()"
        B->>T: "load_batch_state()"
        T-->>B: "Batch progress & results"
        B-->>C: "200: {status, counts, progress}"
        
        opt "Export CSV"
            C->>A: "GET /api/check-logo/batch/export-csv/{batch_id}"
            A->>B: "export_batch_csv()"
            B->>T: "validate_batch_exists()"
            B->>B: "Generate CSV with results"
            B->>S: "Save to exports/{batch_id}.csv"
            B-->>C: "FileResponse: CSV download"
        end
    end
```

**Fallback Description:** Step 1: Client → POST /api/start-batch → FastAPI App creates batch_id → batch_tracker initializes batch → File Storage creates batch state → Returns 201 with batch_id. Step 2: Client → POST /api/init-batch with batch_id, client_id, total → batch_tracker updates state → Returns 200. Step 3: Client → POST /api/check-logo/batch/ with files/URLs + batch_id → Validates batch exists and files provided → For each image: detect_logo processes with white boundary and sequential model testing (yolov8s_logo_detection variants → yolov11s variants) → Updates batch progress. Step 4: Client checks status via GET /api/check-logo/batch/{batch_id}/status and optionally exports CSV via GET /api/check-logo/batch/export-csv/{batch_id}.

</details>

### YOLO Model Detection Pipeline

This detailed sequence diagram expands on the batch processing pipeline, showing the 6-phase process with emphasis on the image processing loop and sequential model testing with early exit logic. It demonstrates real-time WebSocket updates, validation checks, preprocessing steps, and the complete model cascade from YOLOv8s to YOLOv11s variants.

<details>
<summary><strong>🎯 Detailed YOLO Detection Sequence</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '20px', 'fontWeight': 'bold', 'messageFontWeight': 'bold', 'noteFontWeight': 'bold'}}}%%
sequenceDiagram
    participant C as "Client (React)"
    participant A as "FastAPI App"
    participant B as "batch.py"
    participant T as "batch_tracker.py"
    participant D as "detect_logo.py"
    participant M as "YOLO Models"
    participant S as "File Storage"
    participant W as "WebSocket"

    rect rgba(40, 100, 160, 0.4)
        Note over C,A: "Phase 1: Batch Initialization"
        C->>A: "POST /api/start-batch"
        A->>B: "create_batch_id()"
        B->>T: "initialize_batch(batch_id)"
        T->>S: "Create data/{batch_id}.json"
        B-->>C: "201: {batch_id: uuid4()}"
    end

    rect rgba(40, 100, 160, 0.4)
        Note over C,A: "Phase 2: Batch Configuration"
        C->>A: "POST /api/init-batch"
        Note right of C: "{batch_id, client_id, total}"
        A->>B: "init_batch_processing()"
        B->>T: "update_batch_state()"
        Note right of T: "Set total count, client_id"
        B-->>C: "200: Batch initialized"
    end
    
    rect rgba(30, 90, 50, 0.4)
        Note over C,A: "Phase 3: File Processing"
        C->>A: "POST /api/check-logo/batch/"
        Note right of C: "FormData: files[] + batch_id<br/>OR JSON: image_paths[] + batch_id"
        A->>B: "process_batch_images()"
        
        alt "Validation Checks"
            B->>T: "validate_batch_exists(batch_id)"
            alt "Batch not found"
                T-->>B: "Batch not found"
                B-->>C: "400: Invalid batch ID"
            end
            
            B->>B: "validate_files_or_urls()"
            alt "No files provided"
                B-->>C: "400: Files or URLs required"
            end
        end
    end
    
    rect rgba(90, 50, 100, 0.4)
        Note over B,M: "Phase 4: Image Processing Loop"
        loop "For each image/URL"
            B->>D: "check_logo(image_data)"
            
            alt "Image preprocessing"
                D->>D: "PIL.Image.open()"
                D->>D: "ImageOps.expand(border=10, fill='white')"
                D->>D: "Convert to RGB if needed"
            end
            
            alt "Sequential Model Testing (Early Exit)"
                D->>M: "yolov8s_logo_detection.predict(conf=0.35)"
                alt "Symphony detected (conf >= 0.35)"
                    M-->>D: "Valid detection result"
                    D-->>B: "Return early with result"
                else "No detection"
                    D->>M: "yolov8s_logo_detection2.predict(conf=0.35)"
                    alt "Symphony detected"
                        M-->>D: "Valid detection result"
                        D-->>B: "Return early with result"
                    else "No detection"
                        D->>M: "yolov8s_logo_detection3.predict(conf=0.35)"
                        alt "Symphony detected"
                            M-->>D: "Valid detection result"
                            D-->>B: "Return early with result"
                        else "No detection"
                            D->>M: "yolov11s_logo_detection.predict(conf=0.35)"
                            alt "Symphony detected"
                                M-->>D: "Valid detection result"
                                D-->>B: "Return early with result"
                            else "No detection"
                                D->>M: "yolov11s3_logo_detection.predict(conf=0.35)"
                                alt "Symphony detected"
                                    M-->>D: "Valid detection result"
                                    D-->>B: "Return with result"
                                else "All models failed"
                                    M-->>D: "No valid detection"
                                    D-->>B: "Return invalid result"
                                end
                            end
                        end
                    end
                end
            end
            
            B->>T: "update_batch_progress()"
            B->>W: "send_progress_update(client_id)"
            Note right of W: "Real-time progress to frontend"
        end
    end
    
    rect rgba(120, 40, 50, 0.4)
        Note over B,S: "Phase 5: Finalization"
        B->>T: "finalize_batch_state()"
        T->>S: "Save complete results to data/"
        B-->>C: "200: {batch_id, message: 'Processing complete', status: 'processing'}"
    end

    rect rgba(60, 80, 110, 0.4)
        Note over C,S: "Phase 6: Status & Export"
        
        opt "Status Check"
            C->>A: "GET /api/check-logo/batch/{batch_id}/status"
            A->>B: "get_batch_status()"
            B->>T: "load_batch_state()"
            T-->>B: "{status, counts: {total, processed, valid, invalid}, progress: %}"
            B-->>C: "200: Status response"
        end
        
        opt "CSV Export"
            C->>A: "GET /api/check-logo/batch/export-csv/{batch_id}"
            A->>B: "export_batch_csv()"
            B->>T: "validate_batch_exists()"
            B->>B: "Generate CSV with headers:<br/>Image_Path, Is_Valid, Confidence, Detected_By, Bounding_Box"
            B->>S: "Save to exports/{batch_id}_results.csv"
            B-->>C: "FileResponse: CSV download"
            Note over S: "APScheduler cleanup after 24h"
        end
    end
```

**Fallback Description:** Phase 1: Batch Initialization - Client creates batch_id via POST /api/start-batch. Phase 2: Batch Configuration - Client sets parameters via POST /api/init-batch. Phase 3: File Processing - Client submits FormData files or JSON image_paths via POST /api/check-logo/batch/ with validation checks. Phase 4: Image Processing Loop - For each image: PIL.Image.open() → ImageOps.expand(border=10, fill='white') → Sequential Model Testing with early exit (yolov8s_logo_detection → yolov8s_logo_detection2 → yolov8s_logo_detection3 → yolov11s_logo_detection → yolov11s3_logo_detection, each with conf=0.35) → Update batch progress → Send WebSocket progress updates. Phase 5: Finalization - Save complete results to data/. Phase 6: Status & Export - Client checks status and optionally exports CSV with APScheduler cleanup after 24h.

</details>

### Error Handling and Monitoring

This diagram illustrates the comprehensive error handling system, showing error sources (input validation, batch processing, model inference, file operations, rate limiting), error processing flow, test coverage with pytest scenarios, and logging & monitoring infrastructure with APScheduler cleanup.

<details>
<summary><strong>⚠️ Error Handling & Monitoring Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Error Sources"
        style A1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A3 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A4 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A5 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        A1["Input Validation<br/>- Invalid file types<br/>- Missing batch ID<br/>- Empty requests"] -->|"400 Bad Request"| B["FastAPI Error Handler"]
        A2["Batch Processing<br/>- Batch not found<br/>- Invalid batch state"] -->|"404 Not Found"| B
        A3["Model Inference<br/>- Model loading errors<br/>- Prediction failures"] -->|"500 Internal Error"| B
        A4["File Operations<br/>- File read/write errors<br/>- Storage issues"] -->|"500 Internal Error"| B
        A5["Rate Limiting<br/>- Too many requests<br/>- SlowAPI limits"] -->|"429 Too Many Requests"| B
    end

    subgraph "Error Processing"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Classify & Log"| C["Error Response Generator<br/>- HTTPException with detail<br/>- Structured error messages<br/>- Status code mapping"]
        C -->|"Return to Client"| D["JSON Error Response<br/>{detail: 'error message',<br/>status_code: xxx}"]
    end

    subgraph "Test Coverage"
        style E fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Pytest Coverage"| E["test_batch.py<br/>- Invalid batch ID tests<br/>- Missing files tests<br/>- Mixed valid/invalid files"]
        E -->|"Test Scenarios"| F["Batch Lifecycle Tests<br/>- Multiple file upload<br/>- URL processing<br/>- Status checking"]
        F -->|"Edge Cases"| G["Error Scenarios<br/>- Empty batch processing<br/>- Single file handling<br/>- Invalid file types"]
    end

    subgraph "Logging & Monitoring"
        style H fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Write Logs"| H["Logger Utils<br/>- Structured logging<br/>- Error categorization<br/>- Batch tracking"]
        H -->|"Store Logs"| I["logs/ Directory<br/>- Application logs<br/>- Error logs<br/>- Performance metrics"]
        I -->|"Cleanup"| J["APScheduler<br/>- Log rotation<br/>- Size-based cleanup<br/>- Retention policies"]
    end
```

**Fallback Description:** Error Sources: Input Validation (invalid file types, missing batch ID, empty requests) → 400 Bad Request; Batch Processing (batch not found, invalid state) → 404 Not Found; Model Inference (loading errors, prediction failures) → 500 Internal Error; File Operations (read/write errors, storage issues) → 500 Internal Error; Rate Limiting (too many requests, SlowAPI limits) → 429 Too Many Requests. Error Processing: FastAPI Error Handler → Error Response Generator (HTTPException with detail, structured messages, status code mapping) → JSON Error Response. Test Coverage: test_batch.py with invalid batch ID tests, missing files tests, mixed valid/invalid files, batch lifecycle tests, URL processing, status checking, error scenarios. Logging & Monitoring: Logger Utils (structured logging, error categorization, batch tracking) → logs/ Directory (application logs, error logs, performance metrics) → APScheduler (log rotation, size-based cleanup, retention policies).

</details>

### File Storage and Cleanup System

This diagram shows the file management architecture, illustrating how multipart file uploads and image URLs are processed through utils/file_ops.py, stored in various directories (temp_uploads/, uploads/, exports/, data/, logs/), managed through batch_tracker.py, and automatically cleaned up via APScheduler with WebSocket state management.

<details>
<summary><strong>🗄️ File Storage & Cleanup Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "File Input Processing"
        style A1 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A3 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A1["Multipart File Upload<br/>FastAPI UploadFile[]"] -->|"Process Files"| A3["utils/file_ops.py<br/>File validation & processing"]
        A2["Image URL Array<br/>JSON image_paths[]"] -->|"Validate URL"| A3
    end

    subgraph "Storage Directories"
        style B1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B3 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B4 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style B5 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        A3 -->|"Save Temp Files"| B1["temp_uploads/<br/>Temporary processing files<br/>Auto-cleanup every 30min"]
        A3 -->|"Store Uploads"| B2["uploads/<br/>Persistent uploaded files<br/>Long-term storage"]
        A3 -->|"Generate CSV"| B3["exports/<br/>CSV export files<br/>batch_{id}_results.csv<br/>24h retention"]
        A3 -->|"Track Batches"| B4["data/<br/>Batch state JSON files<br/>{batch_id}.json<br/>24h retention"]
        A3 -->|"Write Logs"| B5["logs/<br/>Application logs<br/>10MB rotation limit"]
    end

    subgraph "Batch State Management"
        style C1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style C2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style C3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        B4 -->|"Manage State"| C1["utils/batch_tracker.py<br/>- initialize_batch()<br/>- update_batch_state()<br/>- validate_batch_exists()"]
        C1 -->|"Save/Load State"| C2["JSON State Files<br/>- batch_id, client_id<br/>- total, processed counts<br/>- results array"]
        C1 -->|"Test Coverage"| C3["test_batch.py<br/>- Batch lifecycle tests<br/>- Status validation<br/>- Error scenarios"]
    end

    subgraph "Automated Cleanup (APScheduler)"
        style D1 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style D2 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style D3 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style D4 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        B1 -->|"Delete Old Files"| D1["cleanup_temp_uploads()<br/>Every 30 minutes<br/>Remove processing artifacts"]
        B4 -->|"Remove Expired Batches"| D2["cleanup_old_batches()<br/>Every 1 hour<br/>24h retention policy"]
        B5 -->|"Rotate Large Logs"| D3["Log Rotation<br/>10MB size limit<br/>Prevent disk overflow"]
        D1 -->|"Execute Cleanup"| D4["utils/cleanup.py<br/>Scheduled maintenance<br/>Resource management"]
        D2 -->|"Execute Cleanup"| D4
        D3 -->|"Execute Cleanup"| D4
    end

    subgraph "WebSocket State Management"
        style E1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style E2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        C1 -->|"Connect WebSocket"| E1["utils/ws_manager.py<br/>Real-time communication<br/>Client-specific connections"]
        E1 -->|"Send Progress"| E2["Progress Updates<br/>Batch processing status<br/>Real-time feedback"]
    end
```

**Fallback Description:** File Input Processing: Multipart File Upload (FastAPI UploadFile[]) and Image URL Array (JSON image_paths[]) → utils/file_ops.py for validation & processing. Storage Directories: temp_uploads/ (temporary processing files, 30min auto-cleanup), uploads/ (persistent uploaded files), exports/ (CSV export files, batch_{id}_results.csv, 24h retention), data/ (batch state JSON files, {batch_id}.json, 24h retention), logs/ (application logs, 10MB rotation limit). Batch State Management: utils/batch_tracker.py (initialize_batch(), update_batch_state(), validate_batch_exists()) → JSON State Files (batch_id, client_id, total/processed counts, results array) → test_batch.py (batch lifecycle tests, status validation, error scenarios). Automated Cleanup (APScheduler): cleanup_temp_uploads() every 30 minutes, cleanup_old_batches() every 1 hour with 24h retention, Log Rotation with 10MB size limit → utils/cleanup.py for scheduled maintenance. WebSocket State Management: utils/ws_manager.py for real-time communication → Progress Updates with batch processing status.

</details>

### CSV Export Lifecycle

This sequence diagram details the CSV export process, showing the complete workflow from client request through batch validation, CSV generation with headers and metadata, file creation in exports/ directory, and FileResponse delivery with automatic cleanup scheduling.

<details>
<summary><strong>📄 CSV Export Sequence Diagram</strong> (Click to expand)</summary>
  
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
sequenceDiagram
    participant C as Client
    participant A as export.py Router
    participant B as batch_tracker.py
    participant D as Batch State
    participant S as exports/ Directory
    participant E as CSV Generator

    rect rgba(40, 100, 160, 0.6)
        C->>A: GET /api/check-logo/batch/export-csv/{batch_id}
        A->>B: validate_batch_exists(batch_id)
        B->>D: Load batch state from data/{batch_id}.json
        alt "Batch not found"
            D-->>A: 404 Batch not found
            A-->>C: HTTPException 404
        end
    end

    rect rgba(30, 90, 50, 0.6)
        D-->>B: Return batch results
        B-->>A: Batch validation successful
        A->>E: Generate CSV from batch data
        Note right of E: Rate limited by SlowAPI
    end

    rect rgba(90, 50, 100, 0.6)
        E->>E: Create CSV headers
        Note right of E: Image_Path, Is_Valid, Confidence,<br/>Detected_By, Bounding_Box, Processing_Time
        E->>E: Format batch results
        Note right of E: Include all processed images<br/>Add batch metadata and timestamps<br/>Handle both valid and invalid results
        E->>E: Include model detection details
        Note right of E: Sequential model results<br/>yolov8s_logo_detection variants<br/>yolov11s_logo_detection variants
    end

    rect rgba(120, 40, 50, 0.6)
        E->>S: Save CSV to exports/{batch_id}.csv
        S-->>A: Return file path
        A->>A: Create FileResponse with headers
        Note right of A: Content-Disposition: attachment<br/>filename=batch_{batch_id}_results.csv
        A-->>C: FileResponse with CSV download
    end

    rect rgba(60, 80, 110, 0.6)
        Note over S: Auto-cleanup scheduled
        Note over A: APScheduler cleans exports/ every 24h
        Note over E: Handles mixed valid/invalid files
        Note over B: Batch state persists in data/ directory
        Note over A: Error handling for missing batches
    end
```

**Fallback Description:** Client → GET /api/check-logo/batch/export-csv/{batch_id} → export.py Router validates batch exists via batch_tracker.py → Loads batch state from data/{batch_id}.json. If batch not found → 404 HTTPException. If successful → CSV Generator creates headers (Image_Path, Is_Valid, Confidence, Detected_By, Bounding_Box, Processing_Time), formats batch results (all processed images, batch metadata, timestamps, valid/invalid results, model detection details from yolov8s/yolov11s variants) → Saves CSV to exports/{batch_id}.csv → Creates FileResponse with Content-Disposition attachment → Returns CSV download to Client. Auto-cleanup: APScheduler cleans exports/ every 24h, handles mixed valid/invalid files, batch state persists in data/ directory, error handling for missing batches.

</details>

## Project Structure

```
usingYolo/                         # 🏠 Root project directory
├── 🚀 App.py                      # ⭐ MAIN ENTRY POINT - FastAPI application
├── detect_logo.py                  # Core YOLO detection logic with 5 models
├── train.py                        # Model training script
├── requirements.txt                # Python dependencies
├── requirements-dev.txt            # Development dependencies
├── .env                           # Environment configuration
├── README.md                      # Project documentation
│
├── routers/                      # 🛣️ API route handlers - FastAPI endpoint definitions
│   ├── __init__.py
│   ├── single.py                 # Single image validation endpoint
│   ├── batch.py                  # Batch processing endpoints
│   ├── export.py                 # CSV export functionality
│   ├── admin_auth.py             # Admin authentication routes
│   ├── batch_history.py          # Batch history management
│   ├── dashboard_stats.py        # Dashboard statistics API
│   └── websocket.py              # WebSocket endpoints
│
├── yolo_service/                 # 🤖 Dedicated YOLO detection microservice (port 8001)
│   ├── ⭐ main.py                # YOLO SERVICE ENTRY POINT - Detection API
│   ├── start.py                  # Service startup script
│   └── detect_logo.py            # YOLO model inference logic
│
├── utils/                        # 🔧 Utility modules - Shared functionality and helpers
│   ├── __init__.py
│   ├── logger.py                  # Centralized logging configuration
│   ├── file_ops.py                # File operations and management
│   ├── cleanup.py                 # Automated cleanup tasks (APScheduler)
│   ├── batch_tracker.py           # Batch state management
│   ├── security.py                # CSRF protection and security utilities
│   ├── ws_manager.py              # WebSocket connection management
│   ├── websocket.py               # WebSocket utilities
│   ├── emailer.py                 # Email notification system
│   └── password.py                # Password utilities
│
├── runs/detect/                  # 🧠 AI model storage - Trained YOLO model weights
│   ├── yolov8s_logo_detection/   # Primary YOLOv8s model
│   │   └── weights/best.pt
│   ├── yolov8s_logo_detection2/  # Enhanced YOLOv8s model
│   │   └── weights/best.pt
│   ├── yolov8s_logo_detection3/  # Refined YOLOv8s model
│   │   └── weights/best.pt
│   ├── yolov11s_logo_detection/  # YOLOv11s model
│   │   └── weights/best.pt
│   └── yolov11s3_logo_detection/ # Optimized YOLOv11s model
│       └── weights/best.pt
│
├── frontend/                     # 💻 React frontend application (port 3000)
│   ├── package.json               # Frontend dependencies
│   ├── set-backend.js             # Backend URL configuration script
│   ├── public/                   # 📁 Static assets - HTML, icons, manifest
│   ├── build/                    # 📦 Production build output - Compiled React app
│   └── src/                      # 📝 Source code - React components and logic
│       ├── 🚀 App.js             # ⭐ REACT ENTRY POINT - Main application
│       ├── router.js             # React Router configuration
│       ├── config.js             # API configuration
│       ├── FileUploader.js       # Main upload component
│       ├── UploadStatus.js       # Upload status component
│       ├── components/           # 🧩 React components - Reusable UI elements
│       │   ├── AdminLogin.js     # Admin authentication
│       │   ├── AdminNavLink.js   # Admin navigation
│       │   ├── AppNavigation.js  # Main navigation
│       │   ├── Dashboard.js      # Admin dashboard
│       │   ├── BatchHistory.js   # Batch history viewer
│       │   ├── BatchProcessingForm.js # Batch processing form
│       │   ├── ProgressBar.js    # Real-time progress tracking
│       │   └── EmailInput.js     # Email notification input
│       └── utils/                # 🔧 Frontend utilities - Helper functions
│           ├── imageChunker.js   # Batch processing utilities
│           ├── clientId.js       # Client ID generation
│           └── auth.js           # Authentication helpers
│
├── services/                     # 🔌 Additional service modules - External integrations
├── tasks/                        # ⏰ Background task definitions - Scheduled jobs
├── models/                       # 📊 Model-related utilities - Pydantic schemas
├── tests/                        # 🧪 Test suite - Automated testing
├── test/                         # 📷 Test images and data - Sample files for testing
├── temp_uploads/                 # 📂 Temporary file storage - Auto-cleanup every 30min
├── uploads/                      # 📁 Persistent uploads - Long-term file storage
├── exports/                      # 📄 CSV export storage - Batch results (24h retention)
├── data/                         # 💾 Application data - Batch states and metadata
├── logs/                         # 📋 Application logs - Rotating log files (10MB limit)
├── docs/                         # 📚 Additional documentation - Project guides
└── .venv/                        # 🐍 Python virtual environment - Isolated dependencies
```

## Technology Stack

### Backend Infrastructure
- **FastAPI 0.115.12** - High-performance async web framework
- **Python 3.7+** - Core runtime environment
- **Ultralytics 8.3.151** - YOLOv8 and YOLOv11 model support
- **Pillow 11.2.1** - Advanced image processing
- **APScheduler 3.10.4** - Automated task scheduling
- **SlowAPI 0.1.9** - Intelligent rate limiting
- **Uvicorn 0.34.3** - ASGI server with WebSocket support
- **Torch 2.7.1 + TorchVision 0.22.1** - Deep learning framework
- **OpenCV 4.11.0.86** - Computer vision operations
- **Pandas 2.3.0** - Data processing and CSV export
- **Redis 6.2.0** - Caching and session management
- **Celery 5.5.3** - Distributed task processing
- **Requests 2.32.3** - HTTP library for URL-based image processing

### Frontend Stack
- **React 19.1.0** - Modern UI framework with latest features
- **Material-UI 7.1.0** - Professional component library with icons
- **Axios 1.9.0** - HTTP client for API communication
- **React Dropzone 14.3.8** - Drag-and-drop file uploads
- **React Router DOM 6.30.1** - Client-side routing
- **Cross-env 7.0.3** - Cross-platform environment variables
- **Emotion React/Styled 11.14.0** - CSS-in-JS styling solution
- **Web Vitals 2.1.4** - Performance monitoring
- **Testing Library** - Comprehensive testing suite (DOM, React, User Event)

### AI/ML Components
- **5 Specialized YOLO Models:**
  - `yolov8s_logo_detection` - Primary YOLOv8s model
  - `yolov8s_logo_detection2` - Enhanced YOLOv8s with additional training data
  - `yolov8s_logo_detection3` - Refined YOLOv8s with optimized parameters
  - `yolov11s_logo_detection` - Advanced YOLOv11s model
  - `yolov11s3_logo_detection` - Optimized YOLOv11s variant
- **Confidence Threshold:** 0.35 (configurable)
- **Early Detection Return** - Stops processing when logo is found
- **Model Cascade** - Sequential model execution for optimal accuracy
- **GPU Acceleration** - CUDA support for faster inference
- **Image Enhancement** - Automatic boundary addition (10px white border)
- **URL Processing** - Direct HTTP/HTTPS image URL support
- **Robust Error Handling** - Graceful model failure recovery

### Development & Testing Tools
- **Pytest 8.0.2** - Backend testing framework
- **Pytest-asyncio 0.23.5** - Async testing support
- **Black 24.2.0** - Python code formatting
- **Flake8 7.0.0** - Code linting and style checking
- **Jest** - Frontend testing (via React Scripts)
- **ESLint** - JavaScript/TypeScript linting
- **Cross-env** - Environment variable management

## Installation

> **Requirements:** Python 3.7+ | Node.js 14+ | 4GB+ RAM | Optional GPU

### Development vs Production Setup

**Development Setup:**
- Uses `--reload` for hot-reloading
- Separate terminals for backend services
- Frontend with development server
- Detailed logging and debugging

**Production Setup:**
- Multi-worker backend deployment
- Built frontend assets
- Optimized logging and monitoring
- Environment-based configuration

### System Requirements

### Backend Setup

#### 1. Clone the repository:
```bash
```bash
git clone https://github.com/Dhruv0306/SymphonyProject1/
cd usingYolo
```

#### 2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
```
> **Troubleshooting:** If `python -m venv` fails, try `python3 -m venv` or install `python3-venv` package

#### 3. Install dependencies:
```bash
pip install -r requirements.txt
```
> **Troubleshooting:** If PyTorch installation fails, visit [pytorch.org](https://pytorch.org) for platform-specific commands

#### 4. Create necessary directories:
```bash
mkdir -p temp_uploads data  # Linux/Mac
mkdir temp_uploads data     # Windows
```
> **Troubleshooting:** If permission denied, run with `sudo` (Linux/Mac) or as Administrator (Windows)

#### 5. Start the backend:
##### 1. Start background service:
```bash
cd yolo_service

# Default configuration (localhost + port 8001)
python start.py

# With custom port
uvicorn main:app --reload --host custom-host --port 8001
```
##### 2. Start the Api (In new Terminal):
```bash
# Default configuration (localhost + port 8000)
uvicorn App:app --reload

# With custom host or port
uvicorn App:app --reload --host custom-host --port custom-port
```
#### * Host in both API and background service ***must always be same***

### Frontend Setup

#### 1. Navigate to the frontend directory:
```bash
cd frontend
```

#### 2. Install dependencies:
```bash
npm install
```
> **Troubleshooting:** If `npm install` fails, try `npm install --legacy-peer-deps` or delete `node_modules/` and retry

#### 3. Start the frontend:
```bash
# Using npm start-backend script with custom backend 
npm run start-backend -- --backend=http://your-backend-url:8000

# Or using default backend (http://localhost:8000)
npm run start-backend

# Alternative: Direct React start with environment variable
npm start  # Uses REACT_APP_BACKEND_URL=http://localhost:8000
```
> **Troubleshooting:** If port 3000 is busy, React will prompt for an alternative port. If backend connection fails, verify the backend is running on the specified port
##### Alternatively use --host to set custom host and --port for custom port

---

## Configuration

### Environment Variables

#### Required Variables Table

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

#### Configuration Methods

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

### Backend Configuration

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

### Model Configuration

The YOLO models are automatically loaded from the following paths in `detect_logo.py`:

```python
MODEL_PATHS = [
    "runs/detect/yolov8s_logo_detection/weights/best.pt",    # Primary YOLOv8s model
    "runs/detect/yolov8s_logo_detection2/weights/best.pt",   # Enhanced with additional data
    "runs/detect/yolov8s_logo_detection3/weights/best.pt",   # Refined parameters
    "runs/detect/yolov11s_logo_detection/weights/best.pt",   # YOLOv11s comparison model
    "runs/detect/yolov11s3_logo_detection/weights/best.pt"   # Optimized YOLOv11s
]

CONFIDENCE_THRESHOLD = 0.35  # Adjustable detection threshold
```

**Key Features:**
- **Sequential Processing:** Models are loaded and executed in order
- **Early Return:** Detection stops at the first successful match above confidence threshold
- **Boundary Enhancement:** Images are automatically enhanced with white boundaries
- **URL Support:** Both local files and HTTP/HTTPS URLs are supported
- **Robust Error Handling:** Failed models are skipped with detailed logging

## Running the Application

### First Run Checklist

**Before starting the application, verify:**

- ✅ `.env` file created with required variables
- ✅ Virtual environment activated
- ✅ Dependencies installed (`pip install -r requirements.txt`)
- ✅ Model weights present in `runs/detect/*/weights/best.pt`
- ✅ Required directories created (`temp_uploads/`, `data/`)
- ✅ Frontend dependencies installed (`npm install`)
- ✅ Ports 8000, 8001, and 3000 available

### Quick Start

> **Important:** Both the main API (port 8000) and YOLO service (port 8001) must be running for the system to function properly.

**Terminal 1 - Main API:**
```bash
# From project root
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - YOLO Detection Service:**
```bash
# From project root
cd yolo_service
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 3 - Frontend:**
```bash
# From frontend directory
npm run start-backend
```

4. **Access the application:**
- **Web Interface:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs
- **Alternative API docs:** http://localhost:8000/redoc
- **Root endpoint:** http://localhost:8000 (redirects to docs)

### Custom Configuration

The frontend supports flexible configuration via the `set-backend.js` script:
```bash
# Custom backend URL and port
npm run start-backend -- --backend=http://your-server:8000 --port=3001 --host=0.0.0.0

# Available parameters:
# --backend=<url>  : Custom backend URL (default: http://localhost:8000)
# --port=<port>    : Custom frontend port (default: 3000)
# --host=<host>    : Custom host IP (default: localhost)

# Environment variable approach
REACT_APP_BACKEND_URL=http://your-server:8000 npm start
```

### WebSocket Configuration

The system uses WebSocket connections for real-time updates:
- **Connection URL:** `ws://localhost:8000/ws/{client_id}`
- **Heartbeat Interval:** 30 seconds
- **Automatic Reconnection:** Built-in connection management
- **Progress Updates:** Real-time batch processing status

**Frontend Features:**
- **Single & Batch Processing:** Toggle between single image validation and batch processing
- **File Upload & URL Input:** Support for both file uploads and image URLs
- **Real-time Progress:** WebSocket-based progress tracking with time estimates
- **Admin Dashboard:** Secure admin interface with batch history and statistics
- **Email Notifications:** Optional email alerts for batch completion
- **Retry Logic:** Automatic retry for failed chunks with user-initiated retry option
- **CSV Export:** Download batch results with metadata
- **Responsive Design:** Mobile-optimized interface with drawer navigation
- **Symphony Branding:** Consistent color scheme (#0066B3) and logo integration
- **Configurable Batch Size:** Adjustable batch processing size (1-999 images)
- **Upload Status Tracking:** Real-time status indicators for each file

### Development Mode

For development, you can run both the backend and frontend with hot-reloading:

1. Backend (with auto-reload):
```bash
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```
2. Start the Background Detection Service(In new Terminal):
```bash
# From the project root directory
cd yolo_service
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

3. Frontend (with custom backend URL):
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

3. Run the background detection service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## API Documentation

The application provides comprehensive API documentation:

- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Summary:** [http://localhost:8000/api](http://localhost:8000/api)

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/check-logo/single/` | POST | Validate a single image (file or URL) |
| `/api/start-batch` | POST | Start a new batch session |
| `/api/check-logo/batch/` | POST | Submit images or URLs for batch processing |
| `/api/check-logo/batch/export-csv` | GET | Export batch results as CSV |
| `/api/admin/login` | POST | Admin login |
| `/api/admin/batch-history` | GET | Admin batch history |
| `/api/admin/dashboard-stats` | GET | Admin dashboard stats |
| `/ws/batch/{batch_id}` | WebSocket | Real-time batch progress updates |

### Example Requests & Responses

**Single Image Validation:**
```bash
# File upload
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -F "file=@image.jpg"

# URL validation
curl -X POST "http://localhost:8000/api/check-logo/single/" \
  -H "Content-Type: application/json" \
  -d '{"image_path": "https://example.com/image.jpg"}'
```

**Response:**
```json
{
  "Image_Path_or_URL": "image.jpg",
  "Is_Valid": "Valid",
  "Confidence": 0.87,
  "Detected_By": "yolov8s_logo_detection",
  "Bounding_Box": [120, 45, 280, 180]
}
```

**Start Batch Processing:**
```bash
curl -X POST "http://localhost:8000/api/start-batch"
```

**Response:**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Batch created successfully"
}
```

---

## Security

### Security Features
- Admin authentication (JWT/session cookie)
- CSRF protection
- Rate limiting (SlowAPI)
- CORS protection
- Secure file handling and input validation

### Security Best Practices

**Credential Management:**
- ⚠️ **Never expose admin credentials in public repositories**
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Store secrets in `.env` file (excluded from version control)
- Use environment variables in production

**Secret Rotation:**
```bash
# Generate new cookie secret
python -c "import secrets; print(secrets.token_hex(32))"

# Update .env file
COOKIE_SECRET=new_generated_secret

# Restart application to apply changes
```

**Production Security:**
- Enable HTTPS in production
- Use reverse proxy (nginx/Apache) with SSL termination
- Implement IP whitelisting for admin endpoints
- Regular security updates for dependencies
- Monitor logs for suspicious activity

---

## Error Handling

### Error Response Format

All API errors follow a standardized format:

```json
{
  "detail": "Batch not found with ID: invalid-batch-id",
  "status_code": 404,
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/check-logo/batch/invalid-batch-id/status"
}
```

### Common Error Codes
- **400 Bad Request:** Invalid input, missing files, malformed data
- **404 Not Found:** Batch not found, invalid endpoints
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Model failures, system errors

### Log Files & Interpretation

**Log Locations:**
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: Console output

**Sample Log Entry:**
```
2024-01-15 10:30:15,123 - INFO - batch_tracker - Batch 550e8400 initialized with 5 images
2024-01-15 10:30:16,456 - ERROR - detect_logo - Model yolov8s_logo_detection failed to load
2024-01-15 10:30:17,789 - WARNING - cleanup - Cleaned 3 expired batches
```

**Log Levels:**
- **INFO:** Normal operations, batch progress
- **WARNING:** Non-critical issues, cleanup activities
- **ERROR:** Failed operations, model errors
- **DEBUG:** Detailed debugging information (development only)

---

## Testing

### Test Coverage Goals

**Backend Coverage (Target: 85%+):**
- ✅ All API endpoints (single, batch, admin, export)
- ✅ Error scenarios (invalid inputs, missing batches, model failures)
- ✅ Batch lifecycle (initialization, processing, completion)
- ✅ WebSocket connections and progress updates
- ✅ Authentication and authorization flows
- ✅ File operations and cleanup tasks

**Frontend Coverage (Target: 80%+):**
- ✅ Component rendering and user interactions
- ✅ API integration and error handling
- ✅ WebSocket communication
- ✅ Admin authentication flows
- ✅ File upload and batch processing UI

### Running Tests

**Backend Tests:**
```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_batch.py -v
```

**Frontend Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test
npm test -- --testNamePattern="FileUploader"
```

### CI/CD Integration

**GitHub Actions Example:**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backend Tests
        run: |
          pip install -r requirements.txt
          pytest --cov=. --cov-report=xml
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm install
          npm test -- --coverage --watchAll=false
```

---

## Development Guidelines

### Code Standards
- **Python:** PEP 8 compliance, type hints, comprehensive docstrings
- **JavaScript:** ESLint + Prettier configuration, JSDoc comments
- **Git:** Conventional commits, feature branches, pull request reviews

### Best Practices
- Write tests for new features and bug fixes
- Update documentation with code changes
- Use meaningful variable and function names
- Keep functions small and focused
- Handle errors gracefully with proper logging

---

## Troubleshooting

### Common Issues

**Application Won't Start:**
- Check logs in `logs/app.log` for detailed error messages
- Verify `.env` file exists with required variables
- Ensure model weights exist in `runs/detect/*/weights/best.pt`
- Confirm ports 8000, 8001, 3000 are available

**Detection Not Working:**
- Verify both API (8000) and YOLO service (8001) are running
- Check model file permissions and paths
- Test with `/api` endpoint for system health

**Frontend Connection Issues:**
- Confirm backend URL in frontend configuration
- Check CORS settings for cross-origin requests
- Verify WebSocket connectivity for real-time updates

**Performance Issues:**
- Monitor system resources (RAM, CPU, GPU)
- Check log file sizes and rotation settings
- Review batch processing chunk sizes

---

## License & Support

### License
This project is licensed under the Apache License 2.0. See the LICENSE file for details.

### Support & Contact
- **Technical Support:** Contact Symphony Limited IT Department
- **Email:** inter.it@symphonylimited.com
- **Documentation:** Comprehensive API docs available at `/docs`
- **Issues:** Report bugs and feature requests through your organization's channels

### Contributing
This is an internal Symphony Limited project. For contributions:
1. Follow the established coding standards
2. Ensure all tests pass
3. Update documentation as needed
4. Submit changes through proper review channels

### Acknowledgments
- Built using Ultralytics YOLO models
- FastAPI framework for robust API development
- React and Material-UI for modern frontend experience
- Symphony Limited
