/**
 * FileUploader Component
 * 
 * A comprehensive React component for uploading and processing images with logo detection.
 * Supports both single image and batch processing modes, with file upload or URL input methods.
 * Features real-time progress tracking, WebSocket communication, and retry mechanisms.
 * 
 * @component
 * @author Symphony AI Team
 * @version 2.0.0
 */

// React and Material-UI imports
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Container, Typography, Paper, Button, CircularProgress, 
  Radio, RadioGroup, FormControlLabel, FormControl, TextField, 
  Grid, useTheme, useMediaQuery, Drawer, IconButton, LinearProgress, Slider 
} from '@mui/material';

// Material-UI Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MenuIcon from '@mui/icons-material/Menu';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Third-party libraries
import axios from 'axios';

// Internal imports
import { API_BASE_URL, WS_BASE_URL } from './config';
import { chunkImages, processImageChunks} from './utils/imageChunker';
import UploadStatus from './UploadStatus';
import EmailInput from './components/EmailInput';
import { getClientId } from './utils/clientId';
import { decodeUrl } from './utils/urlDecoder';

/**
 * Theme constants for consistent Symphony branding
 * These colors maintain brand consistency across the application
 */
const symphonyBlue = '#0066B3';     // Primary brand color - used for buttons, links, and accents
const symphonyWhite = '#FFFFFF';     // Background color - main content areas
const symphonyGray = '#333333';      // Text color - primary text content
const symphonyLightBlue = '#f0f9ff'; // Secondary background - preview areas and highlights
const symphonyDarkBlue = '#005299';  // Hover/active state - interactive element states

/**
 * Layout constants
 */
const SIDEBAR_WIDTH = 280; // Sidebar width for responsive layout (pixels)

/**
 * Enhanced retry utility function with exponential backoff
 * Implements robust error handling for network requests with intelligent retry logic
 * 
 * @param {Function} fn - The async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number|null} chunkIndex - Optional chunk index for logging purposes
 * @returns {Promise} - Resolves with function result or throws final error
 * @throws {Error} - Throws the last encountered error after all retries exhausted
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000, chunkIndex = null) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      const isRetryableError =
        error.response?.status === 429 || // Rate limit
        error.response?.status >= 500 || // Server errors
        error.code === 'NETWORK_ERROR' || // Network issues
        !error.response; // Network timeout/connection issues

      if (isRetryableError && retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries - 1);
        const chunkInfo = chunkIndex !== null ? ` (Chunk ${chunkIndex + 1})` : '';
        console.log(`Upload failed${chunkInfo}. Retrying in ${delay}ms... (Attempt ${retries} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Log final failure
        const chunkInfo = chunkIndex !== null ? ` for chunk ${chunkIndex + 1}` : '';
        console.error(`Upload failed${chunkInfo} after ${retries} attempts:`, error);
        throw error;
      }
    }
  }
};

/**
 * FileUploader Component
 * Main component for handling image uploads and logo detection processing
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onFilesSelected - Callback function when files are selected
 * @returns {JSX.Element} - Rendered FileUploader component
 */
const FileUploader = ({ onFilesSelected }) => {
  // ==================== STATE MANAGEMENT ====================
  
  // File handling state
  const [files, setFiles] = useState([]);                 // Array of uploaded File objects
  const [preview, setPreview] = useState(null);           // Single image preview URL
  const [previews, setPreviews] = useState([]);          // Array of batch image preview objects
  const [results, setResults] = useState([]);            // Array of logo detection results
  
  // UI state management
  const [loading, setLoading] = useState(false);         // Global loading state indicator
  const [error, setError] = useState(null);              // Error message string
  const [mobileOpen, setMobileOpen] = useState(false);   // Mobile navigation drawer state
  
  // Processing mode configuration
  const [mode, setMode] = useState('single');            // Processing mode: 'single' or 'batch'
  const [inputMethod, setInputMethod] = useState('upload'); // Input method: 'upload' or 'url'
  
  // URL input state
  const [imageUrl, setImageUrl] = useState('');          // Single image URL input
  const [batchUrls, setBatchUrls] = useState('');        // Batch image URLs (newline-separated)
  
  // Progress tracking and batch processing
  const [progress, setProgress] = useState(null);        // Real-time progress data object
  const [processSummary, setProcessSummary] = useState(null); // Final processing summary
  const [batchId, setBatchId] = useState(null);          // Unique batch identifier
  const [batchSize, setBatchSize] = useState(10);        // Images per batch chunk (optimized default)
  const [displayValue, setDisplayValue] = useState(10);  // UI display value for batch size slider
  const [batchRunning, setBatchRunning] = useState(false); // Batch processing status flag
  
  // Upload status tracking
  const [uploadStatuses, setUploadStatuses] = useState({}); // Per-file upload status mapping
  
  // WebSocket communication
  const [websocket, setWebsocket] = useState(null);     // WebSocket connection instance
  const wsRef = useRef(null);                           // WebSocket reference for cleanup
  
  // Timing and performance tracking
  const processStartTimeRef = useRef(null);             // Process start timestamp
  

  
  // Notification system
  const [emailNotification, setEmailNotification] = useState(''); // Email address for batch completion notifications
  
  // Client identification
  const [clientID] = useState(getClientId()); // Unique client identifier for WebSocket
  
  // ==================== RESPONSIVE DESIGN HOOKS ====================
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  /**
   * Utility function to format milliseconds into human-readable time string
   * Provides appropriate precision based on duration length
   * 
   * @param {number} milliseconds - Time duration in milliseconds
   * @returns {string} - Formatted time string (e.g., "2h 30m 15.5s", "45.2s")
   */
  const formatTime = (milliseconds) => {
    const totalSeconds = milliseconds / 1000;
    const hours = totalSeconds / 3600;
    const minutes = (totalSeconds % 3600) / 60;
    const seconds = totalSeconds % 60;

    if (hours >= 1) {
      return `${Math.trunc(hours)}h ${Math.trunc(minutes)}m ${seconds.toFixed(1)}s`;
    } else if (minutes >= 1) {
      return `${Math.trunc(minutes)}m ${seconds.toFixed(1)}s`;
    } else {
      return `${seconds.toFixed(1)}s`;
    }
  };

  /**
   * WebSocket Connection Effect
   * Establishes and manages WebSocket connection for real-time progress updates
   * Handles connection lifecycle, message processing, and cleanup
   */
  useEffect(() => {
    if (wsRef.current) return; // Already connected

    const wsUrl = `${WS_BASE_URL}/ws/${clientID}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWebsocket(ws);
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);

      if (data.event === 'progress') {
        const currentTime = Date.now();
        const elapsedTime = processStartTimeRef.current ? currentTime - processStartTimeRef.current : 0;
        const estimatedTimeRemaining = (data.processed > 0 && elapsedTime > 0) ?
          ((data.total - data.processed) * elapsedTime) / data.processed : 0;

        setProgress({
          processedImages: data.processed,
          totalImages: data.total,
          currentChunk: (data.chunk_index || 0) + 1,
          totalChunks: data.total_chunks || 1,
          percent: data.percentage,
          elapsedTime: elapsedTime > 0 ? formatTime(elapsedTime) : '0s',
          estimatedTimeRemaining: estimatedTimeRemaining > 0 ? formatTime(estimatedTimeRemaining) : 'Calculating...'
        });
        const currentFile = data.current_file || decodeUrl(data.current_url) || '';
        if (data.current_status === "Valid") {
          setUploadStatuses((prev) => ({ ...prev, [currentFile]: "valid" }));
        } else {
          setUploadStatuses((prev) => ({ ...prev, [currentFile]: "invalid" }));
        }
      } else if (data.event === 'retry_start') {
        setProgress({
          isRetry: true,
          retryProgress: `Starting retry for ${data.retry_total} failed requests...`,
          percent: 0
        });
      } else if (data.event === 'complete') {
        setBatchRunning(false);
        setProgress(null);
        const processEndTime = Date.now();
        setProcessSummary({
          totalImages: data.total,
          totalTime: processEndTime - processStartTimeRef.current,
          averageTimePerImage: (processEndTime - processStartTimeRef.current) / data.total,
          startTime: processStartTimeRef.current,
          endTime: processEndTime
        });
        setLoading(false);
      }
    };

    ws.onclose = (event) => {
      if (event.wasClean) {
        console.log('WebSocket disconnected cleanly');
      }
      setWebsocket(null);
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.log('WebSocket connection error (normal in dev mode)');
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [clientID]);

  /**
   * WebSocket Heartbeat Effect
   * Maintains WebSocket connection with periodic heartbeat messages
   * Prevents connection timeout and ensures reliable communication
   */
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ event: "heartbeat", client_id: clientID }));
      }
    }, 30000); // Send heartbeat every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [websocket, clientID]);

  /**
   * Batch Completion Handler Effect
   * Monitors batch processing completion and retrieves final results
   * Automatically triggered when batch processing finishes
   */
  useEffect(() => {
    const handleBatchComplete = async () => {
      if (!batchRunning && batchId) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/check-logo/batch/${batchId}/complete`);
          if (response.data?.results && Array.isArray(response.data.results)) {
            setResults(response.data.results.map(result => ({
              isValid: result.Is_Valid === "Valid",
              message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
              name: decodeUrl(result.Image_Path_or_URL)
            })));
          }
          console.log('Processing complete:', response.data);
        } catch (error) {
          console.error('Error completing batch:', error);
        }
      }
    };

    handleBatchComplete();
  }, [batchRunning, batchId, clientID]);

  /**
   * Toggle mobile navigation drawer visibility
   * Handles responsive navigation for mobile devices
   */
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  /**
   * Preview URL Cleanup Effect
   * Prevents memory leaks by revoking object URLs when component unmounts
   * Essential for proper resource management with file previews
   */
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      previews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [preview, previews]);

  /**
   * Preview Reset Effect
   * Clears preview state when user changes input method or processing mode
   * Ensures UI consistency and prevents stale preview data
   */
  useEffect(() => {
    setPreview(null);
    setPreviews([]);
  }, [inputMethod, mode]);

  /**
   * Handle URL input changes for single image mode
   * Updates preview and resets related state when URL changes
   * 
   * @param {Event} e - Input change event from URL text field
   */
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setResults([]);
    setError(null);
    setUploadStatuses({}); // Reset upload statuses when URL changes

    // Update preview for single mode
    if (mode === 'single') {
      setPreview(url);
    }
  };

  /**
   * Handle URL input changes for batch processing mode
   * Parses newline-separated URLs and generates previews
   * 
   * @param {Event} e - Input change event from batch URLs textarea
   */
  const handleBatchUrlsChange = (e) => {
    const urls = e.target.value;
    setBatchUrls(urls);
    setResults([]);
    setError(null);
    setUploadStatuses({}); // Reset upload statuses when batch URLs change

    // Parse and preview URLs from textarea
    const urlList = urls.split('\n').filter(url => url.trim());
    setPreviews(urlList.map(url => ({ url })));
  };

  /**
   * Handle file selection from file input
   * Processes selected files, generates previews, and updates component state
   * Supports both single and batch processing modes
   * 
   * @param {Event} e - File input change event containing selected files
   */
  const handleFileChange = (e) => {
    const acceptedFiles = Array.from(e.target.files);

    // Reset upload statuses when files change
    setUploadStatuses({});

    if (mode === 'single') {
      const selectedFile = acceptedFiles[0];
      setFiles([selectedFile]);
      setError(null);
      setResults([]);

      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setPreviews([]);
    } else {
      setFiles(acceptedFiles);
      setError(null);
      setResults([]);
      setPreview(null);

      const newPreviews = acceptedFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setPreviews(newPreviews);
    }

    if (onFilesSelected) {
      onFilesSelected(acceptedFiles);
    }
  };

  /**
   * Main submission handler for image processing
   * Orchestrates the entire image processing workflow including:
   * - Input validation
   * - Batch initialization (if applicable)
   * - API communication
   * - Progress tracking
   * - Error handling
   * 
   * @async
   * @throws {Error} - Throws error if processing fails
   */
  const handleSubmit = async () => {
    // Clear previous results and errors before starting new detection
    setResults([]);
    setError(null);
    setProgress(null);
    setProcessSummary(null);

    if (inputMethod === 'upload' && files.length === 0) {
      setError('Please select image(s) first');
      return;
    }

    if (inputMethod === 'url' && mode === 'single' && !imageUrl) {
      setError('Please enter an image URL');
      return;
    }

    if (inputMethod === 'url' && mode === 'batch' && !batchUrls) {
      setError('Please enter image URLs');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    processStartTimeRef.current = startTime;

    if (mode === 'batch') {
      setBatchRunning(true);
    }

    try {
      let newBatchId = null;

      if (mode === 'batch') {
        newBatchId = await handleStartBatch();
        if (!newBatchId) {
          setError('Failed to start batch process');
          setLoading(false);
          return;
        }
        setBatchId(newBatchId);

        // Initialize batch tracking on backend
        const totalImages = inputMethod === 'upload' ? files.length : batchUrls.split('\n').filter(url => url.trim()).length;
        await initializeBatchTracking(newBatchId, clientID, totalImages);
      }

      if (mode === 'single') {
        let response;
        if (inputMethod === 'upload') {
          const formData = new FormData();
          formData.append('file', files[0]);

          // Set uploading status
          setUploadStatuses((prev) => ({ ...prev, [files[0].name]: "uploading" }));

          response = await axios.post(`${API_BASE_URL}/api/check-logo/single/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // Set validating status after upload is complete
          setUploadStatuses((prev) => ({ ...prev, [files[0].name]: "validating" }));

          // Process the response
          const result = await response.data;

          // Update status based on validation result
          if (result.Is_Valid === "Valid") {
            setUploadStatuses((prev) => ({ ...prev, [files[0].name]: "valid" }));
          } else {
            setUploadStatuses((prev) => ({ ...prev, [files[0].name]: "invalid" }));
          }

        } else {
          // For URL input
          const formData = new FormData();
          formData.append('image_path', imageUrl);

          // Set uploading status for URL
          setUploadStatuses((prev) => ({ ...prev, [imageUrl]: "uploading" }));

          response = await axios.post(`${API_BASE_URL}/api/check-logo/single/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          // Set validating status after upload is complete
          setUploadStatuses((prev) => ({ ...prev, [imageUrl]: "validating" }));

          // Process the response
          const result = await response.data;

          // Update status based on validation result
          if (result.Is_Valid === "Valid") {
            setUploadStatuses((prev) => ({ ...prev, [imageUrl]: "valid" }));
          } else {
            setUploadStatuses((prev) => ({ ...prev, [imageUrl]: "invalid" }));
          }
        }

        setResults([{
          isValid: response.data.Is_Valid === "Valid",
          message: `Logo detection result: ${response.data.Is_Valid}${response.data.Error ? ` (${response.data.Error})` : ''}`,
          name: inputMethod === 'upload' ? files[0].name : imageUrl
        }]);
      } else {
        // Batch processing
        if (inputMethod === 'upload') {
          const chunks = chunkImages(files, batchSize);

          const processChunk = async (chunk, chunkIndex) => {
            return await retryWithBackoff(async () => {
              // Add some delay to avoid overwhelming the server (min, max) = (0.5015s, 1.9835s)
              await new Promise(resolve => setTimeout(resolve, 1.5 * batchSize + 500));
              const formData = new FormData();

              // Set uploading status for each file in the chunk
              chunk.forEach(file => {
                formData.append('files', file);
                setUploadStatuses((prev) => ({ ...prev, [file.name]: "uploading" }));
              });

              // Add chunk metadata
              formData.append('client_id', clientID);
              formData.append('batch_id', newBatchId);
              formData.append('chunk_index', chunkIndex);
              formData.append('total_chunks', chunks.length);
              formData.append('total_files', files.length);

              const response = await axios.post(
                `${API_BASE_URL}/api/check-logo/batch/`,
                formData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                }
              );

              // Check for chunk-level errors
              if (response.data.chunk_status === 'error') {
                throw new Error(response.data.message || 'Chunk processing failed');
              }

              // Set validating status for each file after upload
              chunk.forEach(file => {
                setUploadStatuses((prev) => ({ ...prev, [file.name]: "validating" }));
              });

              // Process results and update status
              const results = response.data.results || [];
              results.forEach((result, idx) => {
                const file = chunk[idx];
                if (file) {
                  if (result.Is_Valid === "Valid") {
                    setUploadStatuses((prev) => ({ ...prev, [file.name]: "valid" }));
                  } else {
                    setUploadStatuses((prev) => ({ ...prev, [file.name]: "invalid" }));
                  }
                }
              });

              return results;
            }, 3, 1000, chunkIndex);
          };

          const { results: allResults } = await processImageChunks(
            chunks,
            (chunk, chunkIndex) => processChunk(chunk, chunkIndex),
            (progressData) => {
              // setProgress(progressData);
            }
          );

          setResults(allResults.map((result, index) => ({
            isValid: result.Is_Valid === "Valid",
            message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
            name: files[index].name
          })));
        } else {
          // For batch URL input
          const urls = batchUrls.split('\n').filter(url => url.trim());
          const chunks = chunkImages(urls, batchSize);

          const processChunk = async (chunk, chunkIndex) => {
            return await retryWithBackoff(async () => {
              // Add some delay to avoid overwhelming the server (min, max) = (1.003s, 3.997s)
              await new Promise(resolve => setTimeout(resolve, 3 * batchSize + 1000));
              
              // Set uploading status for each URL in the chunk
              chunk.forEach(url => {
                setUploadStatuses((prev) => ({ ...prev, [url]: "uploading" }));
              });

              const data = {
                image_paths: chunk.map(url => url.trim()),
                batch_id: newBatchId,
                chunk_index: chunkIndex,
                total_chunks: chunks.length,
                total_files: urls.length,
                client_id: clientID
              };
              const response = await axios.post(
                `${API_BASE_URL}/api/check-logo/batch/`,
                JSON.stringify(data),  // Explicitly stringify the JSON
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                }
              );

              // Check for chunk-level errors
              if (response.data.chunk_status === 'error') {
                // Set error status for each URL in failed chunk
                chunk.forEach(url => {
                  setUploadStatuses((prev) => ({ ...prev, [url]: "error" }));
                });
                throw new Error(response.data.message || 'Chunk processing failed');
              }

              // Set validating status for each URL after upload
              chunk.forEach(url => {
                setUploadStatuses((prev) => ({ ...prev, [url]: "validating" }));
              });

              // Backend now processes in background, no immediate results returned
              // Process results and update status
              const results = response.data.results || [];
              results.forEach((result, idx) => {
                const url = chunk[idx];
                if (url) {
                  if (result.Is_Valid === "Valid") {
                    setUploadStatuses((prev) => ({ ...prev, [url]: "valid" }));
                  } else {
                    setUploadStatuses((prev) => ({ ...prev, [url]: "invalid" }));
                  }
                }
              });

              return response.data.results || [];
            }, 3, 1000, chunkIndex);
          };

          const { results: allResults } = await processImageChunks(
            chunks,
            (chunk, chunkIndex) => processChunk(chunk, chunkIndex),
            (progressData) => {
              // setProgress(progressData);
            }
          );

          setResults(allResults.map((result, index) => ({
            isValid: result.Is_Valid === "Valid",
            message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
            name: urls[index]
          })));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.detail || 'An error occurred during processing');
    } finally {
      if (mode === 'single') {
        setLoading(false);
      }
    }
  };



  /**
   * Initialize batch tracking on the backend
   * Sets up server-side tracking for batch processing progress
   * 
   * @param {string} batchId - Unique batch identifier
   * @param {string} clientId - Client identifier for WebSocket communication
   * @param {number} total - Total number of images to process
   * @async
   * @throws {Error} - Throws error if initialization fails
   */
  const initializeBatchTracking = async (batchId, clientId, total) => {
    try {
      await axios.post(`${API_BASE_URL}/api/init-batch`, {
        batch_id: batchId,
        client_id: clientId,
        total: total
      });
      console.log('Batch tracking initialized');
    } catch (error) {
      console.error('Error initializing batch tracking:', error);
      throw error;
    }
  };

  /**
   * Initialize a new batch processing session
   * Creates a new batch ID and sets up server-side batch tracking
   * 
   * @async
   * @returns {string|null} - Returns batch ID on success, null on failure
   * @throws {Error} - Throws error if batch initialization fails
   */
  const handleStartBatch = async () => {
    try {
      const formData = new FormData();

      // Add email if provided for completion notifications
      if (emailNotification.trim()) {
        formData.append('email', emailNotification.trim());
      }
      formData.append('client_id', clientID);

      const response = await axios.post(`${API_BASE_URL}/api/start-batch`, formData);
      setBatchId(response.data.batch_id);
      return response.data.batch_id;
    } catch (error) {
      console.error('Error starting batch:', error);
      setError(error.response?.data?.detail || 'Error starting batch process');
      return null;
    }
  };

  /**
   * Render image preview section based on current mode and input method
   * Dynamically generates preview UI for single images or batch collections
   * Includes upload status indicators and responsive grid layout
   * 
   * @returns {JSX.Element|null} - Preview component or null if no previews
   */
  const renderPreview = () => {
    /**
     * Common grid image box component for consistent preview display
     * 
     * @param {string} src - Image source URL
     * @param {number} index - Image index for key prop
     * @param {string} name - Image name for display
     * @param {string} statusKey - Key for upload status lookup
     * @returns {JSX.Element} - Styled image box component
     */
    const commonGridImageBox = (src, index, name, statusKey) => (
      <Box
        key={index}
        sx={{
          position: 'relative',
          paddingTop: '75%', // 4:3 aspect ratio for consistent layout
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: 1,
          overflow: 'hidden',
          border: `1px solid ${symphonyBlue}20`,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={`Preview ${index + 1}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;base64,...'; // Placeholder fallback
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            No preview available
          </Box>
        )}

        {/* Status badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '4px',
            padding: '2px 4px',
          }}
        >
          <UploadStatus status={uploadStatuses[statusKey]} />
        </Box>

        {/* Caption */}
        {name && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              borderTop: `1px solid ${symphonyBlue}20`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </Typography>
        )}
      </Box>
    );

    if (inputMethod === 'upload') {
      if (mode === 'single' && preview) {
        return (
          <Box sx={{ mt: 2 }}>
            <Paper
              sx={{
                backgroundColor: symphonyLightBlue,
                borderRadius: 2,
                border: `1px solid ${symphonyBlue}20`,
                height: { xs: '300px', sm: '400px' },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: symphonyBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  borderBottom: `1px solid ${symphonyBlue}20`,
                  backgroundColor: symphonyLightBlue,
                }}
              >
                <ImageIcon sx={{ fontSize: 20 }} />
                Preview
              </Typography>
              <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                {commonGridImageBox(preview, 0, files[0]?.name, files[0]?.name)}
              </Box>
            </Paper>
          </Box>
        );
      } else if (mode === 'batch' && previews.length > 0) {
        return (
          <Box sx={{ mt: 2 }}>
            <Paper
              sx={{
                backgroundColor: symphonyLightBlue,
                borderRadius: 2,
                border: `1px solid ${symphonyBlue}20`,
                maxHeight: { xs: '80vh', sm: '600px' },
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: symphonyBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  borderBottom: `1px solid ${symphonyBlue}20`,
                  backgroundColor: symphonyLightBlue,
                }}
              >
                <ImageIcon sx={{ fontSize: 20 }} />
                Previews ({previews.length} images)
              </Typography>
              <Box
                sx={{
                  p: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: 2
                }}
              >
                {previews.map((preview, index) =>
                  commonGridImageBox(preview.url, index, preview.name, preview.name)
                )}
              </Box>
            </Paper>
          </Box>
        );
      }
    } else if (inputMethod === 'url') {
      if (mode === 'single' && imageUrl) {
        return (
          <Box sx={{ mt: 2 }}>
            <Paper
              sx={{
                backgroundColor: symphonyLightBlue,
                borderRadius: 2,
                border: `1px solid ${symphonyBlue}20`,
                height: { xs: '300px', sm: '400px' },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: symphonyBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  borderBottom: `1px solid ${symphonyBlue}20`,
                  backgroundColor: symphonyLightBlue,
                }}
              >
                <ImageIcon sx={{ fontSize: 20 }} />
                URL Preview
              </Typography>
              <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                {commonGridImageBox(imageUrl, 0, imageUrl, imageUrl)}
              </Box>
            </Paper>
          </Box>
        );
      } else if (mode === 'batch' && batchUrls) {
        const urls = batchUrls.split('\n').filter(url => url.trim());
        if (urls.length > 0) {
          return (
            <Box sx={{ mt: 2 }}>
              <Paper
                sx={{
                  backgroundColor: symphonyLightBlue,
                  borderRadius: 2,
                  border: `1px solid ${symphonyBlue}20`,
                  maxHeight: { xs: '80vh', sm: '600px' },
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: symphonyBlue,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    borderBottom: `1px solid ${symphonyBlue}20`,
                    backgroundColor: symphonyLightBlue,
                  }}
                >
                  <ImageIcon sx={{ fontSize: 20 }} />
                  URL Previews ({urls.length} images)
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 2
                  }}
                >
                  {urls.map((url, index) =>
                    commonGridImageBox(url, index, url, url)
                  )}
                </Box>
              </Paper>
            </Box>
          );
        }
      }
    }

    return null;
  };

  /**
   * Render the appropriate input section based on current input method
   * Handles both file upload and URL input interfaces
   * Includes file lists, status indicators, and preview integration
   * 
   * @returns {JSX.Element} - Input section component
   */
  const renderInputSection = () => {
    if (inputMethod === 'upload') {
      return (
        <Box>
          {/* File upload drop zone with visual feedback */}
          <Box
            sx={{
              p: 2,
              border: '2px dashed #0066B3',
              borderRadius: 2,
              textAlign: 'center',
              backgroundColor: '#f0f9ff',
              cursor: 'pointer',
            }}
          >
            <input
              accept="image/*"
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-uploader"
            />
            <label htmlFor="file-uploader">
              <Button
                variant="contained"
                component="span"
                startIcon={<FileUploadIcon />}
                sx={{
                  backgroundColor: '#0066B3',
                  '&:hover': { backgroundColor: '#005299' },
                  mb: 1,
                }}
              >
                Upload Images
              </Button>
            </label>
            <Typography variant="body2" sx={{ color: '#333' }}>
              You can select multiple images.
            </Typography>
          </Box>
          {/* Files list with separate scroll */}
          {files.length > 0 && (
            <Paper
              sx={{
                mt: 2,
                p: 2,
                maxHeight: '100px',
                overflow: 'auto',
                backgroundColor: symphonyLightBlue,
                border: `1px solid ${symphonyBlue}20`,
                borderRadius: 2,
              }}
            >
              {files.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: symphonyBlue,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      wordBreak: 'break-all',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flex: 1
                    }}
                  >
                    <InsertDriveFileIcon sx={{ fontSize: 'inherit' }} />
                    {file.name}
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    <UploadStatus status={uploadStatuses[file.name]} />
                  </Box>
                </Box>
              ))}
            </Paper>
          )}

          {/* Preview section */}
          {renderPreview()}
        </Box>
      );
    } else {
      return (
        <Box>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              backgroundColor: symphonyWhite,
              height: { xs: mode === 'batch' ? '200px' : 'auto', sm: mode === 'batch' ? '250px' : 'auto' }
            }}
          >
            {mode === 'single' ? (
              <TextField
                fullWidth
                label="Image URL"
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="Enter the URL of the image"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  startAdornment: <LinkIcon sx={{ color: symphonyBlue, mr: 1 }} />,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  },
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: symphonyBlue,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: symphonyBlue,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: symphonyBlue,
                  }
                }}
              />
            ) : (
              <Box sx={{ height: '100%' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Image URLs"
                  value={batchUrls}
                  onChange={handleBatchUrlsChange}
                  placeholder="Enter one URL per line"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ color: symphonyBlue, mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
                  }}
                  sx={{
                    height: '100%',
                    '& .MuiInputBase-root': {
                      height: '100%',
                    },
                    '& .MuiInputBase-input': {
                      height: '100% !important',
                      overflow: 'auto !important',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    },
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: symphonyBlue,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: symphonyBlue,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: symphonyBlue,
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
          {renderPreview()}
        </Box>
      );
    }
  };

  const sidebarContent = (
    <Box sx={{
      width: SIDEBAR_WIDTH,
      height: '100%',
      backgroundColor: symphonyWhite,
      borderRight: `1px solid ${symphonyBlue}20`,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{
        p: 3,
        borderBottom: `1px solid ${symphonyBlue}20`,
        backgroundColor: symphonyLightBlue,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Box sx={{
          width: '180px',
          mb: 2
        }}>
          <img
            src="https://symphonylimited.com/static/media/logo.79a9c99154e53db17057.png"
            alt="Symphony Logo"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: symphonyBlue,
            fontWeight: 500,
            textAlign: 'center'
          }}
        >
          Processing Mode
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setFiles([]);
              setPreview(null);
              setResults([]);
              setError(null);
              setImageUrl('');
              setBatchUrls('');
              setUploadStatuses({}); // Reset upload statuses when mode changes
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Paper
              elevation={mode === 'single' ? 3 : 0}
              sx={{
                p: 2,
                backgroundColor: mode === 'single' ? symphonyLightBlue : symphonyWhite,
                border: `1px solid ${mode === 'single' ? symphonyBlue : symphonyBlue + '20'}`,
                borderRadius: 2,
                transition: 'all 0.3s ease'
              }}
            >
              <FormControlLabel
                value="single"
                control={
                  <Radio
                    sx={{
                      color: symphonyBlue,
                      '&.Mui-checked': {
                        color: symphonyBlue,
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{
                      color: symphonyGray,
                      fontWeight: mode === 'single' ? 500 : 400
                    }}>
                      Single Image
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: symphonyGray,
                      opacity: 0.7,
                      fontSize: '0.8rem',
                      mt: 0.5
                    }}>
                      Process one image at a time
                    </Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </Paper>

            <Paper
              elevation={mode === 'batch' ? 3 : 0}
              sx={{
                p: 2,
                backgroundColor: mode === 'batch' ? symphonyLightBlue : symphonyWhite,
                border: `1px solid ${mode === 'batch' ? symphonyBlue : symphonyBlue + '20'}`,
                borderRadius: 2,
                transition: 'all 0.3s ease'
              }}
            >
              <FormControlLabel
                value="batch"
                control={
                  <Radio
                    sx={{
                      color: symphonyBlue,
                      '&.Mui-checked': {
                        color: symphonyBlue,
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{
                      color: symphonyGray,
                      fontWeight: mode === 'batch' ? 500 : 400
                    }}>
                      Batch Processing
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: symphonyGray,
                      opacity: 0.7,
                      fontSize: '0.8rem',
                      mt: 0.5
                    }}>
                      Process multiple images at once
                    </Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </Paper>
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );

  // Update progress display component with larger sizes and retry support
  const ProgressDisplay = ({ progress }) => {
    if (!progress) return null;

    const isRetry = progress.isRetry;
    const progressColor = isRetry ? 'orange' : symphonyBlue;

    return (
      <Box sx={{ width: '100%', mt: 3, mb: 3 }}>
        {isRetry && (
          <Typography variant="h6" color="warning.main" align="center" sx={{ fontSize: '1.4rem', mb: 2 }}>
            🔄 Retrying Failed Images
          </Typography>
        )}

        <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
          {isRetry ? progress.retryProgress : `Processing images: ${progress.processedImages} / ${progress.totalImages}`}
        </Typography>

        {/* Time information with larger text */}
        {!isRetry && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, my: 2 }}>
            <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
              Time elapsed: {progress.elapsedTime}
            </Typography>
            <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
              Est. time remaining: {progress.estimatedTimeRemaining}
            </Typography>
          </Box>
        )}

        {progress.failedChunks > 0 && !isRetry && (
          <Typography variant="h6" color="warning.main" align="center" sx={{ fontSize: '1.2rem', mb: 2 }}>
            ⚠️ {progress.failedChunks} chunks failed (can be retried)
          </Typography>
        )}

        <LinearProgress
          variant="determinate"
          value={progress.percent || progress.percentComplete || 0}
          sx={{
            mt: 2,
            mb: 2,
            height: 12,
            borderRadius: 6,
            backgroundColor: `rgba(${isRetry ? '255, 165, 0' : '0, 102, 179'}, 0.1)`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: progressColor,
              borderRadius: 6,
            }
          }}
        />
        <Typography variant="h6" color="text.secondary" align="center" sx={{ fontWeight: 500, fontSize: '1.4rem' }}>
          {Math.round(progress.percent || progress.percentComplete || 0)}% complete
        </Typography>
      </Box>
    );
  };

  // Add ProcessingSummary component
  const ProcessingSummary = ({ summary, results }) => {
    if (!summary) return null;

    const formatTime = (ms) => {
      if (!ms || isNaN(ms) || ms <= 0) return '0s';
      const totalSeconds = ms / 1000;
      const hours = totalSeconds / 3600;
      const minutes = (totalSeconds % 3600) / 60;
      const seconds = totalSeconds % 60;

      if (hours >= 1) {
        return `${Math.trunc(hours)}h ${Math.trunc(minutes)}m ${seconds.toFixed(1)}s`;
      } else if (minutes >= 1) {
        return `${Math.trunc(minutes)}m ${seconds.toFixed(1)}s`;
      } else {
        return `${seconds.toFixed(1)}s`;
      }
    };

    const validCount = results.filter(r => r.isValid).length;
    const successRate = results.length > 0 ? (validCount / results.length) * 100 : 0;

    return (
      <Paper sx={{
        p: 3,
        mt: 3,
        backgroundColor: symphonyLightBlue,
        border: `1px solid ${symphonyBlue}20`
      }}>
        <Typography variant="h6" sx={{ color: symphonyBlue, mb: 2 }}>
          Processing Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Images
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {summary.totalImages}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Time
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {formatTime(summary.totalTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Processing speed: {summary.totalTime > 0 ? (summary.totalImages / (summary.totalTime / 1000)).toFixed(2) : '0'} images/sec
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Success Rate
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {successRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {validCount} valid / {results.filter(r => !r.isValid).length} invalid
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Avg. Time per Image
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {formatTime(summary.averageTimePerImage)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Min: {summary.totalImages > 0 ? formatTime(summary.totalTime / summary.totalImages) : '0s'}
              </Typography>
            </Box>
          </Grid>

        </Grid>
      </Paper>
    );
  };

  // Update the results section to include both progress and summary
  const renderResults = () => {
    return (
      <Box sx={{ mt: 4 }}>
        {/* Show progress during loading */}
        {loading && (
          <Paper
            sx={{
              p: 4,
              backgroundColor: symphonyWhite,
              borderRadius: 2,
              border: `1px solid ${symphonyBlue}20`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress sx={{ color: symphonyBlue, width: '4rem !important', height: '4rem !important' }} />
            </Box>
            <ProgressDisplay progress={progress} />
          </Paper>
        )}

        {/* Show results section when we have results */}
        {results.length > 0 && !loading && (
          <>
            {/* Show processing summary for batch mode */}
            {mode === 'batch' && processSummary && (
              <ProcessingSummary summary={processSummary} results={results} />
            )}

            {/* Results list */}
            <Paper
              sx={{
                backgroundColor: symphonyWhite,
                borderRadius: 2,
                height: { xs: 'auto', sm: 'calc(100vh - 400px)' },
                maxHeight: { xs: '100%', sm: 'calc(100vh - 400px)' },
                minHeight: { xs: '400px', sm: '500px' },
                display: 'flex',
                flexDirection: 'column',
                mt: { xs: 2, sm: 3 },
                position: { xs: 'relative', sm: 'sticky' },
                bottom: { xs: 'auto', sm: 0 },
                zIndex: 1,
                boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Results header */}
              <Box
                sx={{
                  borderBottom: `1px solid ${symphonyBlue}20`,
                  backgroundColor: symphonyWhite,
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  p: { xs: 3, sm: 2 },
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: symphonyBlue,
                    fontWeight: 500,
                    fontSize: '1.4rem'
                  }}
                >
                  Results ({results.length} {results.length === 1 ? 'image' : 'images'})
                </Typography>
                {mode === 'batch' && (
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: '1rem'
                    }}
                  >
                    <Box component="span" sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'success.main'
                    }}>
                      <CheckCircleIcon sx={{ fontSize: '2.8rem', mr: 1 }} />
                      {results.filter(r => r.isValid).length} Valid
                    </Box>
                    <Box component="span" sx={{ mx: 2 }}>•</Box>
                    <Box component="span" sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'error.main'
                    }}>
                      <CancelIcon sx={{ fontSize: '2.8rem', mr: 1 }} />
                      {results.filter(r => !r.isValid).length} Invalid
                    </Box>
                  </Typography>
                )}
              </Box>

              {/* Results list */}
              <Box sx={{
                flex: 1,
                overflow: 'auto',
                p: { xs: 2, sm: 3 },
                pt: 0
              }}>
                <Grid container spacing={2}>
                  {results.map((result, index) => (
                    <Grid xs={12} sm={6} md={4} key={index}>
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: result.isValid ? 'rgba(76, 175, 80, 0.05)' : 'rgba(211, 47, 47, 0.05)',
                          border: `1px solid ${result.isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(211, 47, 47, 0.1)'}`,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          height: '100%'
                        }}
                      >
                        {result.isValid ? (
                          <CheckCircleIcon sx={{
                            color: 'success.main',
                            fontSize: '2.5rem'
                          }} />
                        ) : (
                          <CancelIcon sx={{
                            color: 'error.main',
                            fontSize: '2.5rem'
                          }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" sx={{
                            color: result.isValid ? 'success.main' : 'error.main',
                            fontWeight: 500,
                            fontSize: '1.1rem',
                            mb: 0.5
                          }}>
                            {result.isValid ? 'Valid Logo' : 'Invalid Logo'}
                          </Typography>
                          <Typography sx={{
                            color: 'text.secondary',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {result.name}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    );
  };

  const handleExportCSV = async () => {
    if (!batchId) {
      alert('No batch ID available. Please start a batch first.');
      return;
    }

    try {
      // Make the request to the export endpoint with batch_id
      const response = await fetch(`${API_BASE_URL}/api/check-logo/batch/export-csv?batch_id=${batchId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      let filename = 'logo_detection_results.csv';
      const contentDisposition = response.headers.get('content-disposition');

      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"'\n\r]+)["']?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // Show error message to user (using your existing error handling UI)
    }
  };

  // Return the component UI
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar for desktop */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Drawer for mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          overflow: 'auto'
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
          {/* Mobile menu button */}
          {isMobile && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  color: symphonyBlue,
                  border: `1px solid ${symphonyBlue}20`,
                  borderRadius: 1,
                  p: 1
                }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="subtitle1" sx={{ color: symphonyGray }}>
                Mode: {mode === 'single' ? 'Single Image' : 'Batch Processing'}
              </Typography>
            </Box>
          )}

          <Box sx={{
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto'
          }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              sx={{
                color: symphonyBlue,
                fontWeight: 'bold',
                mb: 1
              }}
            >
              {mode === 'single' ? 'Single Image Validation' : 'Batch Image Validation'}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: symphonyGray,
                mb: { xs: 3, sm: 4 },
                opacity: 0.8
              }}
            >
              Powered by YOLO Object Detection
            </Typography>

            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 4 },
                mb: { xs: 3, sm: 4 },
                backgroundColor: symphonyWhite,
                borderRadius: 2
              }}
            >
              {/* Input Method Group */}
              <Box
                sx={{
                  backgroundColor: symphonyLightBlue,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  border: `1px solid ${symphonyBlue}20`,
                  mb: { xs: 3, sm: 4 }
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: symphonyBlue,
                    fontWeight: 500,
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  Input Method
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    row
                    value={inputMethod}
                    onChange={(e) => {
                      setInputMethod(e.target.value);
                      setFiles([]);
                      setPreview(null);
                      setResults([]);
                      setError(null);
                      setImageUrl('');
                      setBatchUrls('');
                      setUploadStatuses({}); // Reset upload statuses when input method changes
                    }}
                    sx={{
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <FormControlLabel
                      value="upload"
                      control={
                        <Radio
                          sx={{
                            color: symphonyBlue,
                            '&.Mui-checked': {
                              color: symphonyBlue,
                            },
                          }}
                        />
                      }
                      label="Upload File"
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          color: symphonyGray
                        }
                      }}
                    />
                    <FormControlLabel
                      value="url"
                      control={
                        <Radio
                          sx={{
                            color: symphonyBlue,
                            '&.Mui-checked': {
                              color: symphonyBlue,
                            },
                          }}
                        />
                      }
                      label="Image URL"
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          color: symphonyGray
                        }
                      }}
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                {renderInputSection()}
              </Box>

              {mode === 'batch' && (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  width: '100%',
                  maxWidth: '400px',
                  mx: 'auto'
                }}>
                  <EmailInput
                    email={emailNotification}
                    setEmail={setEmailNotification}
                  />

                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: symphonyBlue,
                      fontWeight: 500,
                      mt: 1,
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    Batch Size: {displayValue} images
                  </Typography>
                  <Box sx={{
                    width: '100%',
                    px: 3,
                    mt: 2,
                    mb: 2
                  }}>
                    <Slider
                      value={displayValue}
                      onChange={(_, value) => {
                        setDisplayValue(value);
                        setBatchSize(value);
                      }}
                      min={1}
                      max={999}
                      step={1}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 250, label: '250' },
                        { value: 500, label: '500' },
                        { value: 999, label: '999' }
                      ]}
                      sx={{
                        color: symphonyBlue,
                        height: 8,
                        '& .MuiSlider-thumb': {
                          height: 24,
                          width: 24,
                          backgroundColor: symphonyWhite,
                          border: `2px solid ${symphonyBlue}`,
                          '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                            boxShadow: 'inherit',
                          },
                        },
                        '& .MuiSlider-track': {
                          height: 8,
                          backgroundColor: symphonyBlue,
                        },
                        '& .MuiSlider-rail': {
                          height: 8,
                          backgroundColor: `${symphonyBlue}20`,
                        },
                        '& .MuiSlider-mark': {
                          backgroundColor: symphonyBlue,
                          height: 8,
                        },
                        '& .MuiSlider-markLabel': {
                          color: symphonyGray,
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          marginTop: 4,
                        },
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: symphonyBlue,
                        }
                      }}
                      valueLabelDisplay="auto"
                      aria-label="Batch size slider"
                    />
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    {[10, 50, 100, 250].map((value) => (
                      <Button
                        key={value}
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setBatchSize(value);
                          setDisplayValue(value);
                        }}
                        sx={{
                          borderColor: symphonyBlue,
                          color: symphonyBlue,
                          '&:hover': {
                            backgroundColor: symphonyLightBlue,
                            borderColor: symphonyBlue,
                          },
                          minWidth: '60px'
                        }}
                      >
                        {value}
                      </Button>
                    ))}
                  </Box>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={handleStartBatch}
                      sx={{
                        borderColor: symphonyBlue,
                        color: symphonyBlue,
                        '&:hover': {
                          backgroundColor: symphonyLightBlue,
                        },
                        minWidth: '200px',
                        height: '48px',
                        fontSize: '1.1rem',
                        mt: 2
                      }}
                    >
                      Start Batch
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    backgroundColor: symphonyBlue,
                    '&:hover': {
                      backgroundColor: symphonyDarkBlue,
                    },
                    minWidth: '200px',
                    height: '48px',
                    fontSize: '1.2rem'
                  }}
                >
                  {loading ? (
                    <CircularProgress size={28} sx={{ color: symphonyWhite }} />
                  ) : (
                    'Process Images'
                  )}
                </Button>
              </Box>
            </Paper>

            {error && (
              <Paper
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: { xs: 2, sm: 3 },
                  backgroundColor: '#ffebee',
                  borderRadius: 2
                }}
              >
                <Typography
                  color="error"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  <ErrorOutlineIcon sx={{ mr: 1 }} />
                  {error}
                </Typography>
              </Paper>
            )}

            {renderResults()}

            {results.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportCSV}
                >
                  Export Results to CSV
                </Button>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default FileUploader;