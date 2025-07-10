# System Architecture

The Symphony Logo Detection System features a microservice-based architecture with a decoupled FastAPI backend, React frontend, and specialized YOLO service for logo detection.

## High-Level System Overview

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
        style E6 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C1 -->|"Call check_logo()"| D["yolo_service/detect_logo.py<br/>Sequential model testing<br/>Confidence threshold 0.35"]
        C2 -->|"Call check_logo()"| D
        D -->|"Via services/yolo_client.py"| D2["yolo_service/<br/>Microservice Architecture<br/>main.py + start.py"]
        D2 -->|"Load Model 1"| E1["runs/detect/yolov8s_logo_detection/<br/>weights/best.pt"]
        D2 -->|"Load Model 2"| E2["runs/detect/yolov8s_logo_detection2/<br/>weights/best.pt"]
        D2 -->|"Load Model 3"| E3["runs/detect/yolov8s_logo_detection3/<br/>weights/best.pt"]
        D2 -->|"Load Model 4"| E4["runs/detect/yolov11s_logo_detection/<br/>weights/best.pt"]
        D2 -->|"Load Model 5"| E5["runs/detect/yolov11s3_logo_detection/<br/>weights/best.pt"]
        D2 -->|"Load Model 6"| E6["runs/detect/yolov11s_cooler_detection/<br/>weights/best.pt"]
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
        style G5 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        D -->|"Save Temp Files"| G1["temp_uploads/<br/>Processing artifacts<br/>30min cleanup"]
        C3 -->|"Generate CSV"| G2["exports/<br/>batch_{id}_results.csv<br/>24h retention"]
        F5 -->|"Write Log Files"| G3["logs/<br/>Application & error logs<br/>Size-based rotation"]
        F1 -->|"Store Batch Data"| G4["data/<br/>{batch_id}.json<br/>State persistence"]
        F1 -->|"Store Pending Files"| G5["exports/{batch_id}/<br/>pending_files.json<br/>pending_files/ directory"]
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

**Fallback Description:** The system consists of a React Frontend (port 3000) connecting to FastAPI App.py (port 8000) through API Router Layer (routers/ directory with single.py, batch.py, export.py, admin_auth.py, websocket.py, dashboard_stats.py, batch_history.py). The Microservice Detection Engine uses yolo_service/detect_logo.py with services/yolo_client.py connecting to yolo_service/ microservice, loading 6 YOLO models from runs/detect/ directories. Utility Services (utils/ directory) include batch_tracker.py, ws_manager.py, cleanup.py, security.py, logger.py, file_ops.py, and background_tasks.py. Storage & Data layer manages temp_uploads/, exports/, logs/, data/ directories, and exports/{batch_id}/ for pending files. Testing & Quality includes tests/ directory with pytest configuration and frontend/src/__tests__/ for React components.

</details>

## FastAPI Application Architecture (App.py)

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
        G -->|"Process Images"| H["yolo_service/detect_logo.py<br/>- Sequential model testing<br/>- Confidence threshold 0.35<br/>- 6 YOLO models"]
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

**Fallback Description:** FastAPI App.py receives requests from React Frontend and applies middleware layers: CORS Middleware → SlowAPI Limiter → Security Utils → Admin Authentication. Requests are routed through API Router Layer (single.py, batch.py, export.py, admin_auth.py, websocket.py) to Validation & Processing (File Operations → yolo_service/detect_logo.py → Logger Utils). Startup & Background Tasks include APScheduler initialization with cleanup jobs, CSRF token cleanup, and WebSocket monitoring. Core Endpoints provide GET /, GET /api, and WebSocket /ws/batch/{batch_id}.

</details>

## React Frontend Component Architecture

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
        D1 -->|"Generate Client ID"| F1["utils/clientId.js<br/>Unique identification<br/>Session tracking"]
        E1 -->|"Handle Auth"| F2["utils/auth.js<br/>Authentication logic<br/>Token management"]
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

**Fallback Description:** React App.js (port 3000) initializes routes through router.js and renders AppNavigation.js. Core Upload Components include FileUploader.js (main interface with zip file support), BatchProcessingForm.js (multi-file upload), ProgressBar.js (real-time progress with ETA), and EmailInput.js (notifications). Admin Components provide AdminLogin.js (authentication), Dashboard.js (control panel), BatchHistory.js (processing history), and AdminNavLink.js (conditional navigation). Utility Services handle clientId.js (unique identification) and auth.js (authentication logic). Backend Communication uses config.js (API configuration), WebSocket connections with heartbeat (ws://localhost:8000/ws/{client_id}), and FastAPI Backend (http://localhost:8000). State Flow: Start Batch → Initialize → Process files with server-side handling.

</details>

## Batch Processing Pipeline

Frontend uploads all files (or a zip) or URLs in a single request. Backend handles chunking, retry, and progress tracking with **dual pending management** (pending_files.json for file uploads, pending_urls.json for URLs). Real-time progress and per-file status are delivered via WebSocket. Final results are fetched after completion via /api/check-logo/batch/{batch_id}/complete.

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
            B->>D: "yolo_service.detect_logo.check_logo(image)"
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
                                alt "No logo detected"
                                    D->>M: "yolov11s_cooler_detection.predict()"
                                end
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

**Fallback Description:** Frontend uploads all files (or a zip) or URLs in a single request. Backend handles chunking, retry, and progress tracking with **dual pending management** (pending_files.json for file uploads, pending_urls.json for URLs). Real-time progress and per-file status are delivered via WebSocket. Final results are fetched after completion via /api/check-logo/batch/{batch_id}/complete. Step 1: Client → POST /api/start-batch → FastAPI App creates batch_id → batch_tracker initializes batch → File Storage creates batch state → Returns 201 with batch_id. Step 2: Client → POST /api/init-batch with batch_id, client_id, total → batch_tracker updates state → Returns 200. Step 3: Client → POST /api/check-logo/batch/ with files/URLs + batch_id → **Creates pending_files.json OR pending_urls.json** → **Saves uploaded files to disk (for file uploads)** → Validates batch exists and files provided → For each image: yolo_service/detect_logo processes with white boundary and sequential model testing (yolov8s_logo_detection variants → yolov11s variants → yolov11s_cooler_detection) → Updates batch progress → **Removes processed files from disk and pending list**. Step 4: Client checks status via GET /api/check-logo/batch/{batch_id}/status and optionally exports CSV via GET /api/check-logo/batch/export-csv/{batch_id} → Background tasks clear pending files/URLs on completion.

</details>

## Enhanced Batch Processing Features

This diagram shows the advanced batch processing capabilities including zip file handling, retry mechanisms, and email notifications.

<details>
<summary><strong>🚀 Advanced Batch Processing Flow</strong> (Click to expand)</summary>

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '18px', 'fontWeight': 'bold'}}}%%
flowchart TD
    subgraph "File Input Processing"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["File Upload/URL Input"] --> B{"File Count > 300?"}
        B -->|"Yes"| C["Create Zip File<br/>zipHelper.js"]
        B -->|"No"| D["Direct Upload"]
        C --> E["Upload Zip to Backend"]
        D --> E
    end

    subgraph "Backend Processing"
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style G fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        E --> F["Extract/Process Files<br/>batch.py"]
        F --> G["Server-Side Processing<br/>background_tasks.py"]
        G --> H["Concurrent YOLO Detection<br/>Semaphore-limited"]
    end

    subgraph "Server-Side Error Handling"
        style I fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style K fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        H --> I{"Timeout/Error?"}
        I -->|"Yes"| J["Server-Side Error Handling"]
        I -->|"No"| L["Update Progress"]
        J --> K["Server-Side Retry Logic"]
        K --> L
    end

    subgraph "Completion & Notification"
        style L fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style N fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style O fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        L --> M["Generate CSV Export"]
        M --> N["Send Email Notification<br/>(if configured)"]
        N --> O["WebSocket Complete Event"]
    end
```

**Fallback Description:** File Input Processing: File Upload/URL Input → Check if File Count > 300 → If Yes: Create Zip File → Upload Zip to Backend; If No: Direct Upload. Backend Processing: Extract/Process Files (batch.py) → Server-Side Processing (background_tasks.py) → Concurrent YOLO Detection (Semaphore-limited). Server-Side Error Handling: Check Timeout/Error → If Yes: Server-Side Error Handling → Server-Side Retry Logic; If No: Update Progress. Completion & Notification: Generate CSV Export → Send Email Notification (if configured) → WebSocket Complete Event.

</details>

## Error Handling and Monitoring

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

## Sequential Model Processing Flow (detect_logo.py)

This diagram demonstrates the core AI detection logic, showing how images (files or URLs) are processed through PIL Image processing with white boundary addition, then sequentially tested against 6 YOLO models with early return optimization. It illustrates the decision flow and result structure for both successful detections and error handling.

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

    subgraph "Sequential Model Execution (yolo_service/detect_logo.py)"
        style D1 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D2 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D3 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D4 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D5 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D6 fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"model.predict(conf=0.35)"| D1["Model 1: yolov8s_logo_detection<br/>Confidence ≥ 0.35"]
        D1 -->|"No Symphony Detected"| D2["Model 2: yolov8s_logo_detection2<br/>Confidence ≥ 0.35"]
        D2 -->|"No Symphony Detected"| D3["Model 3: yolov8s_logo_detection3<br/>Confidence ≥ 0.35"]
        D3 -->|"No Symphony Detected"| D4["Model 4: yolov11s_logo_detection<br/>Confidence ≥ 0.35"]
        D4 -->|"No Symphony Detected"| D5["Model 5: yolov11s3_logo_detection<br/>Confidence ≥ 0.35"]
        D5 -->|"No Symphony Detected"| D6["Model 6: yolov11s_cooler_detection<br/>Confidence ≥ 0.35"]
    end

    subgraph "Early Return Logic"
        style E1 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E2 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        D1 -->|"Symphony Found (Conf ≥ 0.35)"| E1["Return Valid Result<br/>Stop processing other models"]
        D2 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D3 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D4 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D5 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D6 -->|"Symphony Found (Conf ≥ 0.35)"| E1
        D6 -->|"No Symphony in All Models"| E2["Return Invalid<br/>All models failed"]
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

**Fallback Description:** Image Input Processing: File Upload or URL → PIL Image Processing → Add White Boundary (10px). Sequential Model Execution: Model 1 (yolov8s_logo_detection) → Model 2 (yolov8s_logo_detection2) → Model 3 (yolov8s_logo_detection3) → Model 4 (yolov11s_logo_detection) → Model 5 (yolov11s3_logo_detection) → Model 6 (yolov11s_cooler_detection), each with confidence ≥ 0.35. Early Return Logic: If Symphony found (Conf ≥ 0.35) → Return Valid Result and stop processing; if no Symphony in all models → Return Invalid. Result Structure: JSON Response with Image_Path_or_URL, Is_Valid, Confidence, Detected_By, Bounding_Box, Error. Error Handling: Invalid file/URL → Error Response with no confidence/bounding box.

</details>

## File Storage and Cleanup System

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
        style B6 fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        A3 -->|"Save Temp Files"| B1["temp_uploads/<br/>Temporary processing files<br/>Auto-cleanup every 30min"]
        A3 -->|"Store Uploads"| B2["uploads/<br/>Persistent uploaded files<br/>Long-term storage"]
        A3 -->|"Generate CSV"| B3["exports/<br/>CSV export files<br/>batch_{id}_results.csv<br/>24h retention"]
        A3 -->|"Track Batches"| B4["data/<br/>Batch state JSON files<br/>{batch_id}.json<br/>24h retention"]
        A3 -->|"Pending Files"| B6["exports/{batch_id}/<br/>pending_files.json<br/>pending_files/ directory<br/>Fault-tolerant recovery"]
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
        style D5 fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        B1 -->|"Delete Old Files"| D1["cleanup_temp_uploads()<br/>Every 30 minutes<br/>Remove processing artifacts"]
        B4 -->|"Remove Expired Batches"| D2["cleanup_old_batches()<br/>Every 1 hour<br/>24h retention policy<br/>Preserves pending batches"]
        B6 -->|"Clean Old Pending"| D5["cleanup_old_pending_batches()<br/>Every 24 hours<br/>3-day retention for pending"]
        B5 -->|"Rotate Large Logs"| D3["Log Rotation<br/>10MB size limit<br/>Prevent disk overflow"]
        D1 -->|"Execute Cleanup"| D4["utils/cleanup.py<br/>Scheduled maintenance<br/>Resource management"]
        D2 -->|"Execute Cleanup"| D4
        D5 -->|"Execute Cleanup"| D4
        D3 -->|"Execute Cleanup"| D4
    end

    subgraph "WebSocket State Management"
        style E1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style E2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        C1 -->|"Connect WebSocket"| E1["utils/ws_manager.py<br/>Real-time communication<br/>Client-specific connections"]
        E1 -->|"Send Progress"| E2["Progress Updates<br/>Batch processing status<br/>Real-time feedback"]
    end
```

**Fallback Description:** File Input Processing: Multipart File Upload (FastAPI UploadFile[]) and Image URL Array (JSON image_paths[]) → utils/file_ops.py for validation & processing. Storage Directories: temp_uploads/ (temporary processing files, 30min auto-cleanup), uploads/ (persistent uploaded files), exports/ (CSV export files, batch_{id}_results.csv, 24h retention), data/ (batch state JSON files, {batch_id}.json, 24h retention), exports/{batch_id}/ (pending_files.json and pending_files/ directory for fault-tolerant recovery), logs/ (application logs, 10MB rotation limit). Batch State Management: utils/batch_tracker.py (initialize_batch(), update_batch_state(), validate_batch_exists()) → JSON State Files (batch_id, client_id, total/processed counts, results array) → test_batch.py (batch lifecycle tests, status validation, error scenarios). Automated Cleanup (APScheduler): cleanup_temp_uploads() every 30 minutes, cleanup_old_batches() every 1 hour with 24h retention and preserves pending batches, cleanup_old_pending_batches() every 24 hours with 3-day retention for pending batches, Log Rotation with 10MB size limit → utils/cleanup.py for scheduled maintenance. WebSocket State Management: utils/ws_manager.py for real-time communication → Progress Updates with batch processing status.

</details>

## CSV Export Lifecycle

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