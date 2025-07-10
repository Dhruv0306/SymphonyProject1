# Batch Processing

## Workflow Overview

Symphony Logo Detection System implements an advanced batch processing pipeline with fault tolerance, automatic recovery, and real-time progress monitoring.

### Updated Batch Processing Flow

**Frontend uploads all files (or a zip) or URLs in a single request:**
1. User selects files or enters URLs in the frontend interface
2. If file count > 300, frontend automatically creates a zip file using `zipHelper.js`
3. Frontend sends all files/URLs or zip in a single POST request to `/api/check-logo/batch/`

**Backend processes the batch in chunks, handles retries, and sends progress via WebSocket:**
1. Backend receives the single request and validates the batch
2. Server-side chunking logic in `background_tasks.py` processes files in optimal chunks
3. Server-side retry logic in `batch_tracker.py` handles failed requests automatically
4. Progress updates are sent to frontend via WebSocket in real-time

**Frontend receives real-time progress and per-file status via WebSocket:**
1. WebSocket connection established at `ws://localhost:8000/ws/{client_id}`
2. Real-time progress updates show processing status for each file
3. Per-file status indicators: uploading, validating, valid, invalid, error
4. Progress bar displays completion percentage and estimated time remaining

**After completion, frontend fetches results via dedicated endpoint:**
1. Frontend polls `/api/check-logo/batch/{batch_id}/status` for completion
2. Once complete, results are fetched via `/api/check-logo/batch/{batch_id}/complete`
3. CSV export available via `/api/check-logo/batch/export-csv/{batch_id}`
4. Email notifications sent automatically (if configured)

## Fault-Tolerant Batch Processing System

The system implements a **dual tracking system** for both URL-based and file-based batch processing with enhanced recovery mechanisms:

### File-Based Batch Processing

**Problem Solved:** Previously, if the server restarted during large batch processing, remaining images were lost, leading to incomplete batches and wasted compute time.

**Solution:** File-based batch processing now saves uploaded images to disk before processing, enabling automatic recovery after server restarts.

**File Structure:**
- **Metadata:** `exports/{batch_id}/pending_files.json`
- **Image Storage:** `exports/{batch_id}/pending_files/<filename>`
- **Contains:** File names, processing counters, batch metadata

**Recovery Process:**
- On startup, system scans for `pending_files.json` files
- Automatically resumes processing of unprocessed images
- Removes files from disk and pending list as they are processed
- Cleans up all files and metadata when batch completes

**Benefits:**
- **Zero data loss** - no batch is ever lost mid-way
- **Automatic recovery** - server restarts don't break ongoing jobs
- **Reliable tracking** - every image is accounted for
- **Clean finish** - no extra temp files or memory leaks

### URL-Based Batch Processing

**File Structure:**
- Location: `exports/{batch_id}/pending_urls.json`
- Contains: Array of unprocessed image URLs for the batch
- Purpose: Enables automatic recovery of interrupted URL batch processing

**Recovery Process:**
- On startup, system scans for `pending_urls.json` files
- Automatically resumes processing of incomplete batches
- Removes URLs from pending list as they are processed
- Deletes `pending_urls.json` when batch completes successfully

**Benefits:**
- Fault tolerance for long-running batch jobs
- Progress preservation across application restarts
- Reliable processing of large URL batches
- Automatic cleanup of completed batches

### Cleanup Protection

**Smart Cleanup Strategy:**
- **Regular batches:** Cleaned up after 24 hours
- **Pending batches:** **PRESERVED** from cleanup until 3 days
- **Very old pending:** Special cleanup after 3 days (safety mechanism)

**Protection Against Data Loss:**
- Cleanup mechanism preserves batches with pending files/URLs
- Prevents race conditions between cleanup and recovery
- Ensures no data loss during server restarts or deployments

## Processing Pipeline Details

### Initialization Phase
- Client requests a batch ID via POST `/api/start-batch`
- Client initializes batch with total count via POST `/api/init-batch`
- Client submits files/URLs via POST `/api/check-logo/batch/`

### Processing Phase
- Server-side chunking for optimal performance
- Sequential model testing with early exit optimization
- Detailed progress tracking via WebSocket updates
- Automatic retry logic for failed detections

### Completion Phase
- Finalization of batch results
- CSV export generation with detailed metadata
- Email notification with batch summary (if configured)
- Client notification of completion via WebSocket

## Advanced Batch Features

- **Automatic Zip Handling:** Batches with >300 files are automatically zipped for efficient transfer
- **Server-Side Concurrency:** Processing multiple files concurrently with semaphore-limited execution
- **Progress Monitoring:** Real-time tracking of processed files, validation status, and ETA
- **Error Categorization:** Detailed error tracking and reporting for each file
- **Recovery Checkpoints:** Pending state tracking enables resumption after interruption 