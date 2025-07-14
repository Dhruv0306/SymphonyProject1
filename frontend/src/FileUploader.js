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
import { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Paper, 
  Radio, RadioGroup, FormControlLabel, FormControl,
  useTheme, useMediaQuery, Drawer, IconButton
} from '@mui/material';

// Material-UI Icons


import ImageIcon from '@mui/icons-material/Image';

import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MenuIcon from '@mui/icons-material/Menu';


// Third-party libraries
import { FixedSizeGrid as LazyGrid } from 'react-window';

// Internal imports
import UploadStatus from './UploadStatus';
import EmailInput from './components/EmailInput';
import ModeSelector from './components/ModeSelector';
import UrlInputForm from './components/UrlInputForm';
import ChunkSizeSelector from './components/ChunkSizeSelector';
import FileDropzone from './components/FileDropzone';
import UploadButtons from './components/UploadButtons';
import ProgressBar from './components/ProgressBar';
import WsStatusBanner from './components/WsStatusBanner';
import ExportCsvButton from './components/ExportCsvButton';
import BatchSummary from './components/BatchSummary';
import LazyResultRenderer from './components/LazyResultRenderer';
import ConnectionStatus from './components/ConnectionStatus';
import { useBatchUpload } from './hooks/useBatchUpload';
import { batchApi } from './api/batchApi';
import { singleApi } from './api/singleApi';
import { getClientId } from './utils/clientId';
import { createFilePreview, createFilePreviews, createUrlPreviews, cleanupPreviews, cleanupPreview } from './utils/previewBuilder';

/**
 * Theme constants for consistent Symphony branding
 * These colors maintain brand consistency across the application
 */
const symphonyBlue = '#0066B3';     // Primary brand color - used for buttons, links, and accents
const symphonyWhite = '#FFFFFF';     // Background color - main content areas
const symphonyGray = '#333333';      // Text color - primary text content
const symphonyLightBlue = '#f0f9ff'; // Secondary background - preview areas and highlights

/**
 * Layout constants
 */
const SIDEBAR_WIDTH = 280; // Sidebar width for responsive layout (pixels)

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
  const [singleResults, setSingleResults] = useState([]);            // Array of single mode results

  // UI state management
  const [loading, setLoading] = useState(false);         // Global loading state indicator
  const [mobileOpen, setMobileOpen] = useState(false);   // Mobile navigation drawer state

  // Processing mode configuration
  const [mode, setMode] = useState('single');            // Processing mode: 'single' or 'batch'
  const [inputMethod, setInputMethod] = useState('upload'); // Input method: 'upload' or 'url'

  // URL input state
  const [imageUrl, setImageUrl] = useState('');          // Single image URL input
  const [batchUrls, setBatchUrls] = useState('');        // Batch image URLs (newline-separated)

  // Progress tracking and batch processing
  const [chunkSize, setchunkSize] = useState(10);        // Images per batch chunk (optimized default)
  const [displayValue, setDisplayValue] = useState(10);  // UI display value for batch size slider

  // Notification system
  const [emailNotification, setEmailNotification] = useState(''); // Email address for batch completion notifications

  // Client identification
  const [clientID] = useState(getClientId()); // Unique client identifier for WebSocket

  // Use batch upload hook
  const {
    progress,
    processSummary,
    batchId,
    batchRunning,
    uploadStatuses,
    results,
    error: batchError,
    isReconnecting,
    startBatch,
    initializeBatch,
    completeBatch,
    startProcessing,
    resetState,
    setUploadStatuses,
    setError: setBatchError,
    formatTime
  } = useBatchUpload(clientID);

  // Merge batch error with local error  
  const error = batchError || null;
  
  // Use batch results for batch mode, single results for single mode
  const displayResults = mode === 'batch' ? results : singleResults;

  // ==================== RESPONSIVE DESIGN HOOKS ====================
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Responsive grid width for batch preview
  const gridContainerRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(900); // default

  useEffect(() => {
    const handleResize = () => {
      if (gridContainerRef.current) {
        setGridWidth(gridContainerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Batch completion effect
  useEffect(() => {
    if (batchId && !batchRunning) {
      completeBatch(batchId);
      setLoading(false);
    }
  }, [batchRunning, batchId, completeBatch]);

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
        cleanupPreview(preview);
      }
      cleanupPreviews(previews);
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
    setLoading(false);
    resetState();
  }, [inputMethod, mode, resetState]);

  /**
   * Handle URL input changes for single image mode
   * Updates preview and resets related state when URL changes
   * 
   * @param {Event} e - Input change event from URL text field
   */
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setSingleResults([]);
    setBatchError(null);
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
    setSingleResults([]);
    setBatchError(null);
    setUploadStatuses({}); // Reset upload statuses when batch URLs change

    // Parse and preview URLs from textarea
    const urlPreviews = createUrlPreviews(urls);
    setPreviews(urlPreviews);
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
      setBatchError(null);
      setSingleResults([]);

      const previewUrl = createFilePreview(selectedFile);
      setPreview(previewUrl);
      setPreviews([]);
    } else {
      setFiles(acceptedFiles);
      setBatchError(null);
      setSingleResults([]);
      setPreview(null);

      const newPreviews = createFilePreviews(acceptedFiles);
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
    setSingleResults([]);
    setBatchError(null);

    if (inputMethod === 'upload' && files.length === 0) {
      setBatchError('Please select image(s) first');
      return;
    }

    if (inputMethod === 'url' && mode === 'single' && !imageUrl) {
      setBatchError('Please enter an image URL');
      return;
    }

    if (inputMethod === 'url' && mode === 'batch' && !batchUrls) {
      setBatchError('Please enter image URLs');
      return;
    }

    setLoading(true);
    
    if (mode === 'batch') {
      startProcessing();
    }

    try {
      let newBatchId = null;

      if (mode === 'batch') {
        newBatchId = await handleStartBatch();
        if (!newBatchId) {
          setBatchError('Failed to start batch process');
          setLoading(false);
          return;
        }

        const totalImages = inputMethod === 'upload' ? files.length : batchUrls.split('\n').filter(url => url.trim()).length;
        await initializeBatch(newBatchId, totalImages);
      }

      if (mode === 'single') {
        let response;
        const formData = new FormData();
        if (inputMethod === 'upload') {
          formData.append('file', files[0]);
          setUploadStatuses((prev) => ({ ...prev, [files[0].name]: "uploading" }));
        } else {
          formData.append('image_path', imageUrl);
          setUploadStatuses((prev) => ({ ...prev, [imageUrl]: "uploading" }));
        }

        response = await singleApi.processSingleImage(formData);

        const statusKey = inputMethod === 'upload' ? files[0].name : imageUrl;
        setUploadStatuses((prev) => ({ ...prev, [statusKey]: "validating" }));

        const result = response.data;
        const finalStatus = result.Is_Valid === "Valid" ? "valid" : "invalid";
        setUploadStatuses((prev) => ({ ...prev, [statusKey]: finalStatus }));

        setSingleResults([{
          isValid: response.data.Is_Valid === "Valid",
          message: `Logo detection result: ${response.data.Is_Valid}${response.data.Error ? ` (${response.data.Error})` : ''}`,
          name: inputMethod === 'upload' ? files[0].name : imageUrl
        }]);
      } else {
        // Batch processing (no chunking)
        console.log('Starting batch upload. Total Files:', files.length);
        if (inputMethod === 'upload') {
          // If more than 300 files, zip them before upload
          if (files.length > 300) {
            // Dynamically import zipHelper to avoid circular deps
            const { createZipFromFiles } = await import('./utils/zipHelper');
            setUploadStatuses((prev) => {
              const statuses = { ...prev };
              files.forEach(file => {
                statuses[file.name] = "uploading";
              });
              return statuses;
            });

            // Create zip
            const { blob: zipBlob, filename: zipFilename } = await createZipFromFiles(files, newBatchId);

            const formData = new FormData();
            formData.append('zip_file', zipBlob, zipFilename);
            formData.append('client_id', clientID);
            formData.append('batch_id', newBatchId);
            formData.append('total_files', files.length);
            formData.append('chunkSize', chunkSize);

            const response = await batchApi.processBatchFiles(formData);
            console.log('Batch upload completed (zipped). Total files:', files.length);
            console.log('Batch upload response:', response.data);
            files.forEach(file => {
              setUploadStatuses((prev) => ({ ...prev, [file.name]: "validating" }));
            });
            console.log('Batch validation started. Total files:', files.length);
          } else {
            // Upload all files in one request
            const formData = new FormData();
            console.log('Starting batch upload. Total files:', files.length);
            files.forEach(file => {
              formData.append('files', file);
              setUploadStatuses((prev) => ({ ...prev, [file.name]: "uploading" }));
            });

            formData.append('client_id', clientID);
            formData.append('batch_id', newBatchId);
            formData.append('total_files', files.length);
            formData.append('chunkSize', chunkSize);

            const response = await batchApi.processBatchFiles(formData);
            console.log('Batch upload completed. Total files:', files.length);
            console.log('Batch upload response:', response.data);
            files.forEach(file => {
              setUploadStatuses((prev) => ({ ...prev, [file.name]: "validating" }));
            });
            console.log('Batch validation started. Total files:', files.length);
          }
        } else {
          // For batch URL input (all URLs in one request)
          const urls = batchUrls.split('\n').filter(url => url.trim());
          console.log('Starting batch upload. Total urls:', urls.length);
          urls.forEach(url => {
            setUploadStatuses((prev) => ({ ...prev, [url]: "uploading" }));
          });

          const data = {
            image_paths: urls.map(url => url.trim()),
            batch_id: newBatchId,
            total_files: urls.length,
            client_id: clientID,
            chunkSize: chunkSize
          };
          const response = await batchApi.processBatchUrls(data);

          console.log('Batch upload completed. Total urls:', urls.length);
          console.log('Batch upload response:', response.data);
          urls.forEach(url => {
            setUploadStatuses((prev) => ({ ...prev, [url]: "validating" }));
          });
          console.log('Batch validation started. Total urls:', urls.length);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setBatchError(error.response?.data?.detail || 'An error occurred during processing');
    } finally {
      if (mode === 'single') {
        setLoading(false);
      }
    }
  };

  const handleStartBatch = async () => {
    return await startBatch(emailNotification);
  };

  /**
   * LazyImage component with intersection observer for initial loading
   * Only loads images when they become visible in viewport
   */
  const LazyImage = ({ src, alt, style, onError }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const imgRef = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) observer.observe(imgRef.current);
      return () => observer.disconnect();
    }, [src]);

    return (
      <div ref={imgRef} style={style}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
            }}
            onError={onError}
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
              color: 'text.secondary',
              fontSize: '0.8rem'
            }}
          >
            Loading...
          </Box>
        )}
      </div>
    );
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
          <LazyImage
            src={src}
            alt={`Preview ${index + 1}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
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
                flexDirection: 'column',
                overflow: 'hidden', // Prevent overflow
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
              <Box sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Directly use the image with objectFit: contain and no slider */}
                {files[0] && preview && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={preview}
                      alt={files[0]?.name || 'Preview'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        background: '#fff',
                      }}
                    />
                    {/* Status badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '4px',
                        padding: '2px 4px',
                      }}
                    >
                      <UploadStatus status={uploadStatuses[files[0]?.name]} />
                    </Box>
                    {/* Caption */}
                    {files[0]?.name && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '4px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          textAlign: 'center',
                          borderTop: `1px solid ${symphonyBlue}20`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {files[0]?.name}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        );
      } else if (mode === 'batch' && previews.length > 0) {
        // Responsive virtualized grid configuration for batch upload previews
        const MIN_CELL_WIDTH = 260; // px, minimum width for each grid cell
        const GAP = 8; // px, spacing between grid cells (matches MUI spacing)
        const maxGridHeight = 750; // px, maximum height for the grid container

        // Calculate the number of columns based on available grid width and minimum cell width
        const columnCount = Math.max(1, Math.floor((gridWidth + GAP) / (MIN_CELL_WIDTH + GAP))); // Ensure at least 1 column

        // Calculate the actual cell width to fit columns evenly in the grid
        const cellWidth = Math.floor((gridWidth - GAP * (columnCount - 1)) / columnCount); // Ensure cell width is an integer

        // Calculate the number of rows needed to display all previews
        const rowCount = Math.ceil(previews.length / columnCount);

        // Maintain square aspect ratio for each cell
        const cellHeight = cellWidth; // px, height of each grid cell

        // Calculate the grid height, limiting to maxGridHeight for performance
        const gridHeight = Math.min(maxGridHeight, rowCount * (cellHeight + GAP)); // px, total height of the grid
        return (
          <Box sx={{ mt: 2 }}>
            <Paper
              sx={{
                backgroundColor: symphonyLightBlue,
                borderRadius: 2,
                border: `1px solid ${symphonyBlue}20`,
                maxHeight: { xs: '100vh', sm: gridHeight },
                overflow: 'hidden',
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
                  p: 1,
                  borderBottom: `1px solid ${symphonyBlue}20`,
                  backgroundColor: symphonyLightBlue,
                }}
              >
                <ImageIcon sx={{ fontSize: 20 }} />
                Previews ({previews.length} images)
              </Typography>
              <Box ref={gridContainerRef} sx={{ p: 2, width: '95%', boxSizing: 'border-box', mx: 'auto' }}>
                <LazyGrid
                  columnCount={columnCount}
                  columnWidth={cellWidth}
                  height={0.9 * gridHeight}
                  rowCount={rowCount}
                  rowHeight={0.8 * cellHeight}
                  width={gridWidth}
                  style={{ overflowX: 'hidden' }}
                >
                  {({ columnIndex, rowIndex, style }) => {
                    const itemIndex = rowIndex * columnCount + columnIndex;
                    if (itemIndex >= previews.length) return null;
                    const image = previews[itemIndex];
                    return (
                      <div style={{ ...style, paddingRight: GAP, paddingBottom: GAP }} key={itemIndex}>
                        {commonGridImageBox(image.url, itemIndex, image.name, image.name)}
                      </div>
                    );
                  }}
                </LazyGrid>
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
                flexDirection: 'column',
                overflow: 'hidden', // Prevent overflow
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
              <Box sx={{ p: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {imageUrl && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 0',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        background: '#fff',
                      }}
                    />
                    {/* Status badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '4px',
                        padding: '2px 4px',
                      }}
                    >
                      <UploadStatus status={uploadStatuses[imageUrl]} />
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        );
      } else if (mode === 'batch' && batchUrls) {
        const urls = batchUrls.split('\n').filter(url => url.trim());
        if (urls.length > 0) {
          // Responsive virtualized grid configuration for batch upload previews
        const MIN_CELL_WIDTH = 260; // px, minimum width for each grid cell
        const GAP = 8; // px, spacing between grid cells (matches MUI spacing)
        const maxGridHeight = 750; // px, maximum height for the grid container

        // Calculate the number of columns based on available grid width and minimum cell width
        const columnCount = Math.max(1, Math.floor((gridWidth + GAP) / (MIN_CELL_WIDTH + GAP))); // Ensure at least 1 column

        // Calculate the actual cell width to fit columns evenly in the grid
        const cellWidth = Math.floor((gridWidth - GAP * (columnCount - 1)) / columnCount); // Ensure cell width is an integer

        // Calculate the number of rows needed to display all previews
        const rowCount = Math.ceil(previews.length / columnCount);

        // Maintain square aspect ratio for each cell
        const cellHeight = cellWidth; // px, height of each grid cell

        // Calculate the grid height, limiting to maxGridHeight for performance
        const gridHeight = Math.min(maxGridHeight, rowCount * (cellHeight + GAP)); // px, total height of the grid
          return (
            <Box sx={{ mt: 2 }}>
              <Paper
                sx={{
                  backgroundColor: symphonyLightBlue,
                  borderRadius: 2,
                  border: `1px solid ${symphonyBlue}20`,
                  maxHeight: { xs: '100vh', sm: gridHeight },
                  overflow: 'hidden',
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
                <Box ref={gridContainerRef} sx={{ p: 2, width: '95%', boxSizing: 'border-box', mx: 'auto' }}>
                  <LazyGrid
                    columnCount={columnCount}
                    columnWidth={cellWidth}
                    height={0.9 * gridHeight}
                    rowCount={rowCount}
                    rowHeight={0.8 * cellHeight}
                    width={gridWidth}
                    style={{ overflowX: 'hidden' }}
                  >
                    {({ columnIndex, rowIndex, style }) => {
                      const itemIndex = rowIndex * columnCount + columnIndex;
                      if (itemIndex >= urls.length) return null;
                      const url = urls[itemIndex];
                      return (
                        <div style={{ ...style, paddingRight: GAP, paddingBottom: GAP }} key={itemIndex}>
                          {commonGridImageBox(url, itemIndex, url, url)}
                        </div>
                      );
                    }}
                  </LazyGrid>
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
          <FileDropzone onFileChange={handleFileChange} />
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
          <UrlInputForm
            mode={mode}
            imageUrl={imageUrl}
            batchUrls={batchUrls}
            onUrlChange={handleUrlChange}
            onBatchUrlsChange={handleBatchUrlsChange}
          />
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
        <ModeSelector 
          mode={mode}
          setMode={(newMode) => {
            setMode(newMode);
            setFiles([]);
            setPreview(null);
            setSingleResults([]);
            setBatchError(null);
            setImageUrl('');
            setBatchUrls('');
            setUploadStatuses({});
          }}
          inputMethod={inputMethod}
          setInputMethod={(newInputMethod) => {
            setInputMethod(newInputMethod);
            setFiles([]);
            setPreview(null);
            setSingleResults([]);
            setBatchError(null);
            setImageUrl('');
            setBatchUrls('');
            setUploadStatuses({});
          }}
        />
      </Box>
    </Box>
  );





  // Update the results section to include both progress and summary
  const renderResults = () => {
    return (
      <Box sx={{ mt: 4 }}>
        {/* Show progress during loading */}
        <ProgressBar 
          loading={loading} 
          progress={progress} 
          formatTime={formatTime} 
        />

        {/* Show results section when we have results */}
        {displayResults.length > 0 && !loading && (
          <>
            {/* Show processing summary for batch mode */}
            <BatchSummary 
              mode={mode} 
              processSummary={processSummary} 
              results={displayResults} 
            />

            <LazyResultRenderer 
              loading={loading}
              results={displayResults}
              mode={mode}
            />
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
      const response = await batchApi.exportCSV(batchId);

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
    <>
      <ConnectionStatus isConnected={!error} isReconnecting={isReconnecting} />
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
                      setSingleResults([]);
                      setBatchError(null);
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

                  <ChunkSizeSelector
                    displayValue={displayValue}
                    onValueChange={(value) => {
                      setDisplayValue(value);
                      setchunkSize(value);
                    }}
                    onPresetClick={(value) => {
                      setchunkSize(value);
                      setDisplayValue(value);
                    }}
                  />
                </Box>
              )}

              <UploadButtons
                mode={mode}
                loading={loading}
                onSubmit={handleSubmit}
                onStartBatch={handleStartBatch}
              />
            </Paper>

            {isReconnecting && <WsStatusBanner error={error} />}
            {renderResults()}

            {mode === 'batch' && <ExportCsvButton 
              results={displayResults} 
              onExportCSV={handleExportCSV} 
            />}
          </Box>
        </Container>
      </Box>
    </Box>
    </>
  );
};

export default FileUploader;