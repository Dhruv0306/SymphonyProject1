# System Architecture

This document provides a detailed overview of the Symphony Logo Detection System's architecture.

## High-Level System Overview

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Client Layer"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style Z fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["Web Interface"] -->|"HTTP/REST"| B["FastAPI Backend"]
        Z["CLI Client"] -->|"HTTP/REST"| B
    end

    subgraph "Application Layer"
        style B fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style X fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Request Handling"| C["Request Router"]
        C -->|"Authentication"| D["Auth Middleware"]
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
        style L fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style M fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        style N fill:#ffe0b2,stroke:#f57c00,stroke-width:2px,color:#000000,font-weight:bold
        F -->|"Save"| K["Temporary Storage"]
        J -->|"Cache"| L["Redis Cache"]
        B -->|"Logs"| M["Log Files"]
        X -->|"State"| N["Batch State Store"]
    end

    %% Style all edge labels
    linkStyle default color:#000000,font-weight:bold
```

The system is organized into several layers:
- **Client Layer**: Web interface and CLI clients
- **Application Layer**: Request handling, authentication, batch management, and processing
- **Model Layer**: YOLO model management and inference
- **Storage Layer**: File, cache, and batch state management
- **Monitoring**: System metrics and visualization

## Batch Processing Architecture

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Batch Initialization"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["Client Request"] -->|"Start Batch"| B["Generate UUID"]
        B -->|"Create"| C["Batch State"]
    end

    subgraph "Image Processing"
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"Process"| D["Image Queue"]
        D -->|"Validate"| E["Process Images"]
        E -->|"Update"| F["Batch Results"]
    end

    subgraph "Result Management"
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        F -->|"Store"| G["Result Cache"]
        G -->|"Export"| H["CSV Generator"]
        H -->|"Download"| I["Client Response"]
    end

    subgraph "Cleanup"
        style J fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style K fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        I -->|"Trigger"| J["Cleanup Timer"]
        J -->|"Remove"| K["Temporary Files"]
    end
```

Key components of batch processing:
- **Batch Initialization**: UUID generation and state creation
- **Image Processing**: Queue management and parallel processing
- **Result Management**: Caching and CSV generation
- **Cleanup**: Automatic resource management

## Detailed Processing Pipeline

```mermaid
%%{init:{'theme': 'dark','themeVariables': {'fontFamily': 'arial','fontSize': '22px','fontWeight': 'bold','messageFontWeight': 'bold','noteFontWeight': 'bold'}}}%%
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

Key processing stages:
1. Batch initialization and ID generation
2. Image submission with batch tracking
3. Authentication and batch validation
4. Image processing and enhancement
5. Model inference and result aggregation
6. Batch state management
7. CSV export with batch identification

## State Management Architecture

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'fontFamily': 'arial', 'fontSize': '22px', 'fontWeight': 'bold'}}}%%
graph TD
    subgraph "Batch State"
        style A fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style B fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        style C fill:#bbdefb,stroke:#1976d2,stroke-width:2px,color:#000000,font-weight:bold
        A["Batch ID"] -->|"Create"| B["State Object"]
        B -->|"Track"| C["Progress Counter"]
    end

    subgraph "File Management"
        style D fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style E fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        style F fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000000,font-weight:bold
        B -->|"Create"| D["Temp CSV"]
        D -->|"Write"| E["Results"]
        E -->|"Generate"| F["Final CSV"]
    end

    subgraph "Metrics"
        style G fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style H fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        style I fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px,color:#000000,font-weight:bold
        C -->|"Calculate"| G["Valid Count"]
        C -->|"Calculate"| H["Invalid Count"]
        G & H -->|"Update"| I["Batch Stats"]
    end

    subgraph "Lifecycle"
        style J fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style K fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        style L fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000000,font-weight:bold
        I -->|"Monitor"| J["Completion"]
        J -->|"Trigger"| K["Cleanup"]
        K -->|"Remove"| L["State & Files"]
    end
```

State management components:
- **Batch State**: ID management and progress tracking
- **File Management**: Temporary and final CSV handling
- **Metrics**: Processing statistics and counts
- **Lifecycle**: State cleanup and resource management

## Model Architecture

This diagram shows the organization of our YOLO models and their interaction.

![Model Architecture](./images/Model%20Architecture.png)

Features:
- Multiple YOLO model variants (v8s and v11s)
- Load balancing and model selection
- Result aggregation and confidence checking
- Optimized inference pipeline

## Error Handling and Monitoring

This diagram shows our comprehensive error handling and monitoring system.

![Error Handling and Monitoring](./images/Error%20Handling%20and%20Monitoring.png)

Key aspects:
- Error classification and handling
- Logging and metrics collection
- Alert management
- Performance monitoring
- DevOps integration

## Technical Specifications

### Processing Pipeline
- Concurrent image processing
- Automatic model selection
- Early detection return
- CSV export functionality
- Secure file handling

### Storage Management
- Temporary file cleanup
- Cache invalidation
- Result persistence
- Export file management

### Monitoring and Maintenance
- Real-time metrics
- Performance tracking
- Resource utilization
- System health checks

### Security Features
- Input validation
- File sanitization
- Access control
- Rate limiting
- Secure data handling

## Performance Considerations

1. **Optimization Techniques**
   - Concurrent processing
   - Cache utilization
   - Early returns
   - Resource pooling

2. **Scalability Features**
   - Horizontal scaling
   - Load balancing
   - Resource distribution
   - Cache distribution

3. **Resource Management**
   - Memory optimization
   - Storage cleanup
   - Cache invalidation
   - Export file lifecycle

## Future Enhancements

1. **Planned Improvements**
   - Additional model variants
   - Enhanced batch processing
   - Advanced caching strategies
   - Extended export formats

2. **Scalability Plans**
   - Distributed processing
   - Cloud integration
   - Enhanced monitoring
   - Automated scaling

## References

- [API Documentation](./api-reference.md)
- [Deployment Guide](./deployment.md)
- [Security Guidelines](./security.md)
- [Development Guide](./development-guide.md) 