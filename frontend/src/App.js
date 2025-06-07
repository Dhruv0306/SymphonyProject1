/**
 * Symphony Logo Detection Web Application
 * 
 * A React-based web interface for detecting Symphony logos in images.
 * Features:
 * - Single and batch image processing
 * - File upload and URL input support
 * - Real-time progress tracking
 * - Responsive design with mobile support
 * - Material-UI components for modern UI
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, TextField, Grid, useTheme, useMediaQuery, Drawer, IconButton, LinearProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MenuIcon from '@mui/icons-material/Menu';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { API_BASE_URL } from './config';
import { chunkImages, processImageChunks } from './utils/imageChunker';

// Theme constants for consistent branding
const symphonyBlue = '#0066B3';     // Primary brand color
const symphonyWhite = '#FFFFFF';     // Background color
const symphonyGray = '#333333';      // Text color
const symphonyLightBlue = '#f0f9ff'; // Secondary background
const symphonyDarkBlue = '#005299';  // Hover/active state

// Sidebar width for responsive layout
const SIDEBAR_WIDTH = 280;

/**
 * Main application component handling logo detection functionality
 * @component
 */
function App() {
  // State management for file handling and UI
  const [files, setFiles] = useState([]);                 // Uploaded files
  const [preview, setPreview] = useState(null);           // Single image preview
  const [previews, setPreviews] = useState([]);          // Batch image previews
  const [results, setResults] = useState([]);            // Detection results
  const [loading, setLoading] = useState(false);         // Loading state
  const [error, setError] = useState(null);              // Error messages
  const [mode, setMode] = useState('single');            // 'single' or 'batch' mode
  const [inputMethod, setInputMethod] = useState('upload'); // 'upload' or 'url' input
  const [imageUrl, setImageUrl] = useState('');          // Single image URL
  const [batchUrls, setBatchUrls] = useState('');        // Batch image URLs
  const [mobileOpen, setMobileOpen] = useState(false);   // Mobile drawer state
  const [progress, setProgress] = useState(null);        // Progress tracking
  const [processSummary, setProcessSummary] = useState(null); // Processing summary
  const [batchId, setBatchId] = useState(null);  // <-- ADD THIS

  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Toggle mobile navigation drawer
   */
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  /**
   * Handle file drop/selection
   * @param {File[]} acceptedFiles - Array of accepted image files
   */
  const onDrop = (acceptedFiles) => {
    if (mode === 'single') {
      const selectedFile = acceptedFiles[0];
      setFiles([selectedFile]);
      setError(null);
      setResults([]);
      
      // Create preview URL for single image
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setPreviews([]); // Clear batch previews
    } else {
      setFiles(acceptedFiles);
      setError(null);
      setResults([]);
      setPreview(null);
      
      // Create preview URLs for batch images
      const newPreviews = acceptedFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setPreviews(newPreviews);
    }
  };

  // Cleanup preview URLs to prevent memory leaks
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

  // Configure dropzone with accepted file types
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']  // Accept common image formats
    },
    multiple: mode === 'batch'
  });

  // Reset previews when changing input method or mode
  useEffect(() => {
    setPreview(null);
    setPreviews([]);
  }, [inputMethod, mode]);

  /**
   * Handle URL input for single image mode
   * @param {Event} e - Input change event
   */
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setResults([]);
    setError(null);
    
    // Update preview for single mode
    if (mode === 'single') {
      setPreview(url);
    }
  };

  /**
   * Handle URL input for batch mode
   * @param {Event} e - Input change event
   */
  const handleBatchUrlsChange = (e) => {
    const urls = e.target.value;
    setBatchUrls(urls);
    setResults([]);
    setError(null);

    // Parse and preview URLs from textarea
    const urlList = urls.split('\n').filter(url => url.trim());
    setPreviews(urlList.map(url => ({ url })));
  };

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
    const processStartTime = Date.now();

    try {
      if (mode === 'single') {
        let response;
        if (inputMethod === 'upload') {
          const formData = new FormData();
          formData.append('file', files[0]);
          response = await axios.post(`${API_BASE_URL}/api/check-logo/single/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // For URL input
          const formData = new FormData();
          formData.append('image_path', imageUrl);
          response = await axios.post(`${API_BASE_URL}/api/check-logo/single/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
        setResults([{
          isValid: response.data.Is_Valid === "Valid",
          message: `Logo detection result: ${response.data.Is_Valid}${response.data.Error ? ` (${response.data.Error})` : ''}`,
          name: inputMethod === 'upload' ? files[0].name : imageUrl
        }]);
      } else {
        // Batch processing
        if (inputMethod === 'upload') {
          if (files.length >= 100) {
            // Use chunking for large batches
            const chunks = chunkImages(files, 100);
            
            const processChunk = async (chunk) => {
              const formData = new FormData();
              chunk.forEach(file => {
                formData.append('files', file);
              });
              if (batchId) {
                formData.append('batch_id', batchId);
              }

              
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
            };

            const allResults = await processImageChunks(
              chunks,
              processChunk,
              (progressData) => {
                setProgress(progressData);
              }
            );

            // Store final processing summary
            const processEndTime = Date.now();
            setProcessSummary({
              totalImages: files.length,
              totalTime: processEndTime - processStartTime,
              averageTimePerImage: (processEndTime - processStartTime) / files.length,
              startTime: processStartTime,
              endTime: processEndTime
            });

            setResults(allResults.map((result, index) => ({
              isValid: result.Is_Valid === "Valid",
              message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
              name: files[index].name
            })));
          } else {
            // Original processing for smaller batches
            const formData = new FormData();
            files.forEach(file => {
              formData.append('files', file);
            });
            if (batchId) {
              formData.append('batch_id', batchId);
            }
            const response = await axios.post(`${API_BASE_URL}/api/check-logo/batch/`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            // Add processing summary for small batches
            const processEndTime = Date.now();
            setProcessSummary({
              totalImages: files.length,
              totalTime: processEndTime - processStartTime,
              averageTimePerImage: (processEndTime - processStartTime) / files.length,
              startTime: processStartTime,
              endTime: processEndTime
            });
            
            setResults(response.data.map((result, index) => ({
              isValid: result.Is_Valid === "Valid",
              message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
              name: files[index].name
            })));
          }
        } else {
          // For batch URL input
          const urls = batchUrls.split('\n').filter(url => url.trim());
          if (urls.length >= 100) {
            // Use chunking for large URL batches
            const chunks = chunkImages(urls, 100);
            
            const processChunk = async (chunk) => {
              const formData = new FormData();
              formData.append('paths', chunk.join(';'));
              if (batchId) {
                formData.append('batch_id', batchId);
              }
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
            };

            const allResults = await processImageChunks(
              chunks,
              processChunk,
              (progressData) => {
                setProgress(progressData);
              }
            );

            // Add processing summary for small URL batches
            const processEndTime = Date.now();
            setProcessSummary({
              totalImages: urls.length,
              totalTime: processEndTime - processStartTime,
              averageTimePerImage: (processEndTime - processStartTime) / urls.length,
              startTime: processStartTime,
              endTime: processEndTime
            });

            setResults(allResults.map((result, index) => ({
              isValid: result.Is_Valid === "Valid",
              message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
              name: urls[index]
            })));
          } else {
            // Original processing for smaller URL batches
            const formData = new FormData();
            formData.append('paths', urls.join(';'));
            if (batchId) {
              formData.append('batch_id', batchId);
            }
            const response = await axios.post(`${API_BASE_URL}/api/check-logo/batch/`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            // Add processing summary for small URL batches
            const processEndTime = Date.now();
            setProcessSummary({
              totalImages: urls.length,
              totalTime: processEndTime - processStartTime,
              averageTimePerImage: (processEndTime - processStartTime) / urls.length,
              startTime: processStartTime,
              endTime: processEndTime
            });
            
            setResults(response.data.map((result, index) => ({
              isValid: result.Is_Valid === "Valid",
              message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
              name: urls[index]
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.detail || 'An error occurred during processing');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
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
              <Box
                sx={{
                  p: 2,
                  flex: 1,
                  overflow: 'auto'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: 1,
                    border: `1px solid ${symphonyBlue}20`,
                  }}
                >
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
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
                Previews ({previews.length} images)
              </Typography>
              <Box
                sx={{
                  p: 2,
                  flex: 1,
                  overflow: 'auto'
                }}
              >
                <Grid container spacing={2}>
                  {previews.map((preview, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Paper
                        elevation={1}
                        sx={{
                          height: { xs: 120, sm: 150 },
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 1,
                          backgroundColor: 'white',
                          border: `1px solid ${symphonyBlue}20`,
                        }}
                      >
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
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
                          {preview.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
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
              <Box
                sx={{
                  p: 2,
                  flex: 1,
                  overflow: 'auto'
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: 1,
                    border: `1px solid ${symphonyBlue}20`,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="URL Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxsaW5lIHgxPSIxOCIgeTE9IjYiIHgyPSI2IiB5Mj0iMTgiPjwvbGluZT48bGluZSB4MT0iNiIgeTE9IjYiIHgyPSIxOCIgeTI9IjE4Ij48L2xpbmU+PC9zdmc+';
                    }}
                  />
                </Box>
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
                  minHeight: { xs: '200px', sm: '400px' },
                  maxHeight: { xs: '80vh', sm: '600px' },
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
                    p: { xs: 1.5, sm: 2 },
                    borderBottom: `1px solid ${symphonyBlue}20`,
                    backgroundColor: symphonyLightBlue,
                  }}
                >
                  <ImageIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  URL Previews ({urls.length} images)
                </Typography>
                <Box 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 },
                    flex: 1,
                    overflow: 'auto',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: { xs: 1.5, sm: 2 }
                  }}
                >
                  {urls.map((url, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        paddingTop: '75%',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'placeholder-image.png';
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          );
        }
      }
    }
    return null;
  };

  const renderInputSection = () => {
    if (inputMethod === 'upload') {
      return (
        <Box>
          <Paper
            {...getRootProps()}
            sx={{
              p: { xs: 2, sm: 4 },
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? symphonyLightBlue : symphonyWhite,
              border: `2px dashed ${symphonyBlue}`,
              borderRadius: 2,
              height: { xs: '200px', sm: '250px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: symphonyLightBlue,
                borderColor: symphonyDarkBlue,
              },
            }}
          >
            <input {...getInputProps()} />
            <FileUploadIcon 
              sx={{ 
                fontSize: { xs: 32, sm: 48 }, 
                color: symphonyBlue, 
                mb: { xs: 1, sm: 2 },
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: symphonyDarkBlue
                }
              }} 
            />
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              sx={{ 
                color: symphonyGray,
                fontSize: { xs: '0.9rem', sm: '1.25rem' }
              }}
            >
              {isDragActive
                ? 'Drop the file(s) here'
                : `Drag and drop ${mode === 'single' ? 'file' : 'files'} here`}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: symphonyGray, 
                mt: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                opacity: 0.8
              }}
            >
              Limit 200MB per file • PNG, JPG, JPEG
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: { xs: 1, sm: 2 },
                px: { xs: 2, sm: 3 },
                py: { xs: 0.5, sm: 1 },
                backgroundColor: symphonyBlue,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: symphonyDarkBlue,
                  transform: 'translateY(-2px)'
                },
              }}
            >
              Browse files
            </Button>
          </Paper>

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
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ 
                    color: symphonyBlue,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    wordBreak: 'break-all',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <InsertDriveFileIcon sx={{ fontSize: 'inherit' }} />
                  {file.name}
                </Typography>
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

  // Update progress display component with larger sizes
  const ProgressDisplay = ({ progress }) => {
    if (!progress) return null;

    return (
      <Box sx={{ width: '100%', mt: 3, mb: 3 }}>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
          Processing images: {progress.processedImages} / {progress.totalImages}
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
          Chunk: {progress.currentChunk} / {progress.totalChunks}
        </Typography>
        
        {/* Time information with larger text */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, my: 2 }}>
          <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
            Time elapsed: {progress.elapsedTime}
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
            Est. time remaining: {progress.estimatedTimeRemaining}
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progress.percentComplete}
          sx={{ 
            mt: 2, 
            mb: 2,
            height: 12,
            borderRadius: 6,
            backgroundColor: 'rgba(0, 102, 179, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: symphonyBlue,
              borderRadius: 6,
            }
          }}
        />
        <Typography variant="h6" color="text.secondary" align="center" sx={{ fontWeight: 500, fontSize: '1.4rem' }}>
          {Math.round(progress.percentComplete)}% complete
        </Typography>
      </Box>
    );
  };

  // Add ProcessingSummary component
  const ProcessingSummary = ({ summary, results }) => {
    if (!summary) return null;

    const formatTime = (ms) => {
      const totalSeconds = ms / 1000;
      const hours = totalSeconds / 3600;
      const minutes = (totalSeconds % 3600) / 60;
      const seconds = totalSeconds % 60;

      if (hours >= 1) {
        return `${Math.trunc(hours)}h ${Math.trunc(minutes)}m ${seconds.toFixed(3)}s`;
      } else if (minutes >= 1) {
        return `${Math.trunc(minutes)}m ${seconds.toFixed(3)}s`;
      } else {
        return `${seconds.toFixed(3)}s`;
      }
    };

    const validCount = results.filter(r => r.isValid).length;
    const successRate = (validCount / results.length) * 100;

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
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Images
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {summary.totalImages}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Time
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {formatTime(summary.totalTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Processing speed: {(summary.totalImages / (summary.totalTime / 1000)).toFixed(2)} images/sec
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Avg. Time per Image
              </Typography>
              <Typography variant="h4" sx={{ color: symphonyBlue }}>
                {formatTime(summary.averageTimePerImage)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Min: {formatTime(summary.totalTime / summary.totalImages)}
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
                    <Grid item xs={12} sm={6} md={4} key={index}>
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/check-logo/batch/export-csv?batch_id=${batchId}`, {
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
      a.href = url;
      a.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'logo_detection_results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // Show error message to user (using your existing error handling UI)
    }
  };
  
  const handleStartBatch = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/start-batch`);
      setBatchId(response.data.batch_id);
      alert(`Batch started! Batch ID: ${response.data.batch_id}`);
    } catch (error) {
      console.error('Error starting batch:', error);
      alert('Failed to start batch.');
    }
  };

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
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
                      fontSize: '1.1rem'
                    }}
                  >
                    Start Batch
                  </Button>
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCSV}
                sx={{ mt: 2 }}
              >
                Export Results to CSV
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}


export default App;