# Image Validation Using Logo Detection: By Symphony Limited
## Powered by YOLO Object Detection

This application provides an enterprise-grade solution for detecting Symphony logos in images using multiple YOLOv8 and YOLOv11 models. It features a FastAPI backend for robust image processing and a modern web interface for seamless user interaction.

## Key Features

- **Advanced Multi-Model Detection**
  - Utilizes 5 different YOLO models (YOLOv8s and YOLOv11s variants)
  - Early detection return for optimized performance
  - Configurable confidence threshold (currently set at 0.35)
  - Automatic model fallback for improved accuracy

- **Comprehensive Image Processing**
  - Single image validation
  - Batch processing with concurrent execution
  - Support for both file uploads and URLs
  - Automatic image enhancement with boundary addition
  - Robust error handling and validation
  - CSV export functionality for batch results
  - Timestamped result downloads

- **Enterprise-Ready API**
  - RESTful FastAPI implementation
  - Comprehensive API documentation
  - Rate limiting and CORS protection
  - Detailed logging with rotation (10MB limit)
  - Swagger UI integration
  - CSV export endpoint for batch results

- **Modern Frontend Interface**
  - React-based user interface
  - Configurable backend URL
  - Material design components
  - Responsive layout
  - Drag-and-drop file upload
  - Real-time validation feedback

- **Production-Grade Infrastructure**
  - Thread-safe operations
  - Automatic temporary file cleanup
  - Configurable environment settings
  - Comprehensive error tracking
  - Performance optimization features
  - Secure file handling for exports

## Detailed System Architecture

### High-Level System Overview
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px'}}}%%
graph TD
    subgraph "Client Layer"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style Z fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A[Web Interface] -->|HTTP/REST| B[FastAPI Backend]
        Z[CLI Client] -->|HTTP/REST| B
    end

    subgraph "Application Layer"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|Request Handling| C[Request Router]
        C -->|Authentication| D[Auth Middleware]
        D -->|Validation| E[Input Validator]
        E -->|Processing| F[Image Processor]
    end

    subgraph "Model Layer"
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        F -->|Model Selection| G[Model Manager]
        G -->|Inference| H[YOLOv8s Models]
        G -->|Inference| I[YOLOv11s Models]
        H -->|Results| J[Result Aggregator]
        I -->|Results| J
    end

    subgraph "Storage Layer" 
        style K fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style L fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        F -->|Save| K[Temporary Storage]
        J -->|Cache| L[Redis Cache]
        B -->|Logs| M[Log Files]
    end

    subgraph "Monitoring" 
        style N fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style O fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style P fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        B -->|Metrics| N[Prometheus]
        N -->|Visualization| O[Grafana]
        B -->|Traces| P[Jaeger]
    end

    %% Style all edge labels
    linkStyle default color:#000000,font-weight:bold
```

### Detailed Processing Pipeline
```mermaid
%%{init:{'theme': 'dark','themeVariables': {'fontFamily': 'arial','fontSize': '22px','messageFontWeight': 'bold','noteFontWeight': 'bold'}}}%%
sequenceDiagram
    participant C as Client
    participant A as API Gateway
    participant V as Validator
    participant P as Processor
    participant M as Model Pool
    participant E as CSV Exporter
    participant S as Storage

    rect rgba(40, 100, 160, 0.4)
        C->>A: Submit Image
    end
    
    rect rgba(30, 90, 50, 0.4)
        A->>A: Authenticate
        A->>V: Validate Request
    end
    
    rect rgba(90, 50, 100, 0.4)
        V->>P: Process Image
        
        par Image Processing
            P->>P: Enhance Image
            P->>P: Add Boundaries
            P->>P: Normalize
        end
    end
    
    rect rgba(130, 90, 20, 0.4) 
        P->>M: Request Detection
        
        par Model Processing
            M->>M: YOLOv8s #1
            M->>M: YOLOv8s #2
            M->>M: YOLOv11s #1
            M->>M: YOLOv11s #2
            M->>M: YOLOv11s #3
        end
    end
    
    rect rgba(120, 40, 50, 0.4)
        M->>P: Return Results
        P->>S: Cache Results
        P->>A: Aggregate Response
        A->>C: Return Response
    end

    rect rgba(60, 80, 110, 0.4)
        Note over C,S: CSV Export Flow
        C->>A: Request CSV Export
        A->>E: Fetch Batch Results
        E->>S: Get Cached Results
        S-->>E: Return Results
        E->>E: Generate CSV
        Note right of E: Add Timestamps
        E->>S: Store Temporary File
        S-->>A: File Location
        A-->>C: Download CSV
        Note over S: Cleanup Temporary Files
    end
```

### Model Architecture
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px'}}}%%
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

    %% Style all edge labels
    linkStyle default color:#000000,font-weight:bold
```

### Error Handling and Monitoring
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px'}}}%%
graph LR
    subgraph "Error Sources"
        style A1 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A3 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style A4 fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        A1[Input Errors] -->|Validation| B[Error Handler]
        A2[Processing Errors] -->|Runtime| B
        A3[Model Errors] -->|Inference| B
        A4[System Errors] -->|Infrastructure| B
    end

    subgraph "Error Processing" 
        style B fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        B -->|Categorize| C[Error Classifier]
        C -->|Log| D[Error Logger]
        C -->|Alert| E[Alert Manager]
        C -->|Metrics| F[Metrics Collector]
    end

    subgraph "Monitoring Stack" 
        style G fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style K fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style L fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        D -->|Write| G[Log Files]
        E -->|Notify| H[Alert System]
        F -->|Store| I[Prometheus]
        
        G -->|Aggregate| J[Log Aggregator]
        I -->|Visualize| K[Grafana]
        
        J & K -->|Display| L[Dashboard]
        H -->|Notify| M[DevOps Team]
    end

    %% Style all edge labels
    linkStyle default color:#000000,font-weight:bold
```

### Data Flow and Storage
```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px'}}}%%
graph TD
    subgraph "Input Sources" 
        style A1 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A2 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A3 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style A4 fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style X fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A1[File Upload] -->|Process| B[Input Handler]
        A2[URL Input] -->|Process| B
        A3[Batch Upload] -->|Process| B
        A4[CSV Request] -->|Export| X[Export Handler]
    end

    subgraph "Storage Systems" 
        style C fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style Y fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        B -->|Temporary| C[Temp Storage]
        B -->|Persist| D[File System]
        
        C -->|Cleanup| E[Storage Cleaner]
        D -->|Archive| F[Long-term Storage]
        
        X -->|Generate| Y[CSV Export]
        Y -->|Save| D
        Y -->|Cleanup| E
    end

    subgraph "Caching Layer" 
        style G fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style J fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        G[Results Cache] -->|Read| H[Cache Reader]
        I[Processor] -->|Write| G
        
        H -->|Serve| J[API Response]
        H -->|Miss| I
        G -->|Export| Y
    end

    subgraph "Maintenance" 
        style K fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style L fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        K[Scheduler] -->|Trigger| E
        K -->|Manage| L[Cache Invalidator]
        K -->|Cleanup| M[Export Cleaner]
        M -->|Remove Old| Y
        L -->|Clean| G
    end

    %% Style all edge labels
    linkStyle default color:#000000,font-weight:bold
```

## Technology Stack

- **Backend Infrastructure**
  - FastAPI (with async support)
  - Python 3.7+
  - Ultralytics YOLOv8 and YOLOv11
  - PIL for image processing
  - Rotating file logs

- **Frontend Stack**
  - React 19.1.0
  - Material-UI 7.1.0
  - Axios for API calls
  - React Dropzone for file uploads
  - Cross-env for environment variables

- **AI/ML Components**
  - 5 specialized YOLO models
  - Custom confidence thresholds
  - Model ensemble approach
  - Optimized inference pipeline

- **Development Tools**
  - Poetry for dependency management
  - Pre-commit hooks
  - Pytest for testing
  - Black for code formatting

## Installation

### Backend Setup

1. Clone the repository:
```bash
git clone [repository-url]
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

### Frontend Setup

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
# Using npm start-backend script with custom backend
npm run start-backend --backend=http://your-backend-url:8000

# Or using default backend (http://localhost:8000)
npm run start-backend
```

### Docker Installation

1. Build the Docker image:
```bash
docker build -t symphony-logo-detection .
```

2. Run the container:
```bash
docker run -p 8000:8000 -v $(pwd)/data:/app/data symphony-logo-detection
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
API_KEY_HEADER=X-API-Key
CORS_ORIGINS=["http://localhost:3000"]
RATE_LIMIT=100

# Logging
LOG_LEVEL=INFO
LOG_ROTATION=10MB
```

## Running the Application

1. Start the FastAPI backend:
```bash
uvicorn App:app --reload --host 0.0.0.0 --port 8000
```

2. Access the application:
- API Documentation: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

## Production Deployment

### Using Docker Compose

1. Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

2. Deploy:
```bash
docker-compose up -d
```

### Kubernetes Deployment

Basic manifests are provided in the `k8s/` directory for Kubernetes deployment.

### Monitoring

- Prometheus metrics available at `/metrics`
- Grafana dashboard templates in `monitoring/`
- Health check endpoint at `/health`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run pre-commit hooks:
```bash
pre-commit install
pre-commit run --all-files
```
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style

- Follow PEP 8 and use Black for formatting
- Add type hints to all functions
- Maintain test coverage above 80%
- Update documentation for new features

## API Endpoints

### Main Endpoints

1. `/api/check-logo/single/`
   - **Method**: POST
   - **Purpose**: Validate a single image for logo presence
   - **Input**: File upload or image URL
   - **Output**: JSON with validation result

2. `/api/check-logo/batch/`
   - **Method**: POST
   - **Purpose**: Process multiple images for logo detection
   - **Input**: Multiple file uploads or semicolon-separated URLs
   - **Output**: JSON array with validation results

3. `/api/check-logo/batch/export-csv`
   - **Method**: GET
   - **Purpose**: Export latest batch processing results
   - **Output**: CSV file with columns:
     - Image_Path_or_URL
     - Is_Valid
     - Error (if any)
   - **Features**:
     - Timestamped filenames
     - Automatic file cleanup
     - Secure temporary file handling

4. `/check-logo/batch/getCount`
   - **Method**: GET
   - **Purpose**: Get summary of latest batch process
   - **Output**: JSON with valid/invalid counts

## Security Features

- Input validation and sanitization
- Secure file handling
- CORS protection
- Rate limiting
- Sanitized error messages
- Automatic file cleanup

## Error Handling

The system implements comprehensive error handling for:
- Invalid file formats
- Corrupted images
- Network issues
- Model failures
- Resource constraints
- Concurrent processing errors

## Logging System

- Rotating log files (10MB limit)
- Detailed error tracking
- Request/response logging
- Model inference logging
- Performance metrics

## Development Guidelines

1. Code Style
   - Follow PEP 8
   - Use type hints
   - Document all functions
   - Write unit tests

2. Git Workflow
   - Feature branches
   - Pull request reviews
   - Version tagging
   - Changelog updates

## Troubleshooting

1. Check logs.txt for detailed error messages
2. Verify model weights in runs/detect/ directory
3. Ensure proper file permissions
4. Validate image formats (JPG/PNG)
5. Check network connectivity
6. Verify GPU drivers (if applicable)

## License

Copyright © 2024 Symphony Limited. All rights reserved.

## Support

For technical support or feature requests, please contact the Symphony Limited development team at support@symphony.com. 
