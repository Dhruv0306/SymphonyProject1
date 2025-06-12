# System Architecture

This document provides a detailed overview of the Symphony Logo Detection System's architecture.

## High-Level System Overview

The system is organized into several layers:
- **Client Layer**: Modern web interface for image processing
- **Application Layer**: FastAPI backend with rate limiting and request handling
- **Model Layer**: Cascading YOLO model architecture
- **Storage Layer**: Temporary storage and batch state management
- **Monitoring**: System metrics and health monitoring

## Security and Rate Limiting

The system implements robust rate limiting using SlowAPI:
- Single image endpoint: 100 requests per minute
- Batch processing endpoint: 20 requests per minute
- CSV export endpoint: 20 requests per minute

Security measures include:
- CORS protection
- Input validation
- File type filtering
- Size limits enforcement
- Request logging and monitoring

## Model Architecture

The system uses a cascading model approach:

1. Primary Detection:
   - YOLOv8s Model #1 (Confidence threshold: 0.35)
   - Fast initial detection attempt

2. Secondary Detection:
   - YOLOv8s Model #2 (If confidence < 0.35)
   - Different weights and parameters

3. Tertiary Detection:
   - YOLOv8s Model #3 (If still confidence < 0.35)
   - Specialized for complex cases

4. Final Detection:
   - YOLOv11s Model Pool
   - Ensemble processing for difficult cases
   - Aggregated confidence scoring

## Batch Processing Flow

The batch processing system follows these steps:

1. Initialization:
   - Generate unique batch ID
   - Create batch state
   - Initialize progress tracking

2. Processing:
   - Queue management
   - Parallel image processing
   - Model cascade execution
   - Result aggregation

3. Result Management:
   - Progress tracking
   - State updates
   - Temporary storage
   - CSV generation

4. Cleanup:
   - Automatic file cleanup
   - State management
   - Resource release

## CSV Export Lifecycle

The CSV export process includes:

1. Request Phase:
   - Batch ID validation
   - Rate limit check (20/minute)
   - Access verification

2. Data Collection:
   - Fetch batch results
   - Aggregate data
   - Format results

3. CSV Generation:
   - Add headers (Image Path, Validation Result)
   - Include confidence scores
   - Add metadata (Batch ID, Timestamp)
   - Add model details

4. Delivery:
   - Save temporary file
   - Generate download link
   - Clean up after download

## Monitoring and Logging

The system implements comprehensive monitoring:

1. Request Monitoring:
   - Rate limit tracking
   - Endpoint usage statistics
   - Response times

2. Validation Logging:
   - Input validation results
   - File type checks
   - Size limit enforcement

3. Health Metrics:
   - System resource usage
   - Model performance
   - Processing times
   - Success/failure rates

## Performance Considerations

Key performance features:

1. Rate Limiting:
   - Prevents system overload
   - Ensures fair resource distribution
   - Maintains service quality

2. Model Cascade:
   - Efficient resource usage
   - Progressive complexity
   - Optimized for common cases

3. Batch Processing:
   - Parallel execution
   - Resource management
   - Progress tracking

4. Storage Management:
   - Temporary file cleanup
   - State cleanup
   - Resource optimization

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