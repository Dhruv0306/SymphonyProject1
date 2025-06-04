import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, TextField, Card, CardContent, Grid, useTheme, useMediaQuery, Drawer, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MenuIcon from '@mui/icons-material/Menu';
import { API_BASE_URL } from './config';

const symphonyBlue = '#0066B3';  // Official Symphony blue
const symphonyWhite = '#FFFFFF';
const symphonyGray = '#333333';
const symphonyLightBlue = '#f0f9ff';
const symphonyDarkBlue = '#005299';

const SIDEBAR_WIDTH = 280;

function App() {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('single');
  const [inputMethod, setInputMethod] = useState('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const onDrop = (acceptedFiles) => {
    if (mode === 'single') {
      const selectedFile = acceptedFiles[0];
      setFiles([selectedFile]);
      setError(null);
      setResults([]);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setPreviews([]); // Clear batch previews
    } else {
      setFiles(acceptedFiles);
      setError(null);
      setResults([]);
      setPreview(null);
      
      // Create preview URLs for batch mode
      const newPreviews = acceptedFiles.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setPreviews(newPreviews);
    }
  };

  // Cleanup preview URLs when component unmounts or files change
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: mode === 'batch'
  });

  // Clear previews when changing input method
  useEffect(() => {
    setPreview(null);
    setPreviews([]);
  }, [inputMethod, mode]);

  // Handle URL input changes
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

  // Handle batch URLs input changes
  const handleBatchUrlsChange = (e) => {
    const urls = e.target.value;
    setBatchUrls(urls);
    setResults([]);
    setError(null);

    // Update previews for batch mode
    const urlList = urls.split('\n').filter(url => url.trim());
    setPreviews(urlList.map(url => ({ url })));
  };

  const handleSubmit = async () => {
    // Clear previous results and errors before starting new detection
    setResults([]);
    setError(null);

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
        let response;
        if (inputMethod === 'upload') {
          const formData = new FormData();
          files.forEach(file => {
            formData.append('files', file);
          });
          response = await axios.post(`${API_BASE_URL}/api/check-logo/batch/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          setResults(response.data.map((result, index) => ({
            isValid: result.Is_Valid === "Valid",
            message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
            name: files[index].name
          })));
        } else {
          // For batch URL input
          const urls = batchUrls.split('\n').filter(url => url.trim());
          const formData = new FormData();
          formData.append('paths', urls.join(';'));
          response = await axios.post(`${API_BASE_URL}/api/check-logo/batch/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          setResults(response.data.map((result, index) => ({
            isValid: result.Is_Valid === "Valid",
            message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
            name: urls[index]
          })));
        }
      }
    } catch (err) {
      console.error('Error details:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please ensure the backend is running.');
      } else if (err.response?.status === 413) {
        setError('Image file is too large. Please try a smaller image.');
      } else if (err.response?.status === 415) {
        setError('Invalid file type. Please upload a JPG or PNG image.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred while processing the image(s). Please try again.');
      }
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
              if (isMobile) {
                setMobileOpen(false);
              }
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

  // Add this helper function at the top level
  const getBatchSummary = (results) => {
    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;
    const total = results.length;
    // Calculate success rate, ensuring it's 0 when there are no valid logos
    const successRate = total > 0 ? (validCount / total) * 100 : 0;
    
    return {
      validCount,
      invalidCount,
      total,
      successRate: Math.round(successRate) // Round here instead of in the display
    };
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

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    backgroundColor: symphonyBlue,
                    '&:hover': {
                      backgroundColor: symphonyDarkBlue,
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#ccc',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: symphonyWhite }} />
                  ) : (
                    'Process Image' + (mode === 'batch' ? 's' : '')
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

            {results.length > 0 && (
              <Paper 
                sx={{ 
                  backgroundColor: symphonyWhite,
                  borderRadius: 2,
                  height: { xs: 'auto', sm: 'calc(100vh - 400px)' }, // Auto height on mobile, fixed on desktop
                  maxHeight: { xs: '100%', sm: 'calc(100vh - 400px)' },
                  minHeight: { xs: '400px', sm: '500px' },
                  display: 'flex',
                  flexDirection: 'column',
                  mt: { xs: 2, sm: 3 },
                  position: { xs: 'relative', sm: 'sticky' }, // Only sticky on desktop
                  bottom: { xs: 'auto', sm: 0 },
                  zIndex: 1,
                  boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: symphonyBlue,
                    p: { xs: 2, sm: 3 },
                    borderBottom: `1px solid ${symphonyBlue}20`,
                    backgroundColor: symphonyWhite,
                    position: 'sticky',
                    top: 0,
                    zIndex: 2
                  }}
                >
                  Results ({results.length} {results.length === 1 ? 'image' : 'images'})
                </Typography>

                {mode === 'batch' && results.length > 1 && (
                  <Box 
                    sx={{ 
                      px: { xs: 2, sm: 3 },
                      py: 2,
                      borderBottom: `1px solid ${symphonyBlue}20`,
                      backgroundColor: symphonyLightBlue,
                      position: 'sticky',
                      top: '64px',
                      zIndex: 2
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: symphonyBlue,
                        mb: 2,
                        fontWeight: 500
                      }}
                    >
                      Batch Processing Summary
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {/* Valid Logos */}
                      <Grid item xs={6} sm={4}>
                        <Paper 
                          sx={{ 
                            p: 2,
                            backgroundColor: 'rgba(76, 175, 80, 0.05)',
                            border: '1px solid rgba(76, 175, 80, 0.1)',
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: 'success.main',
                              mb: 1,
                              fontWeight: 500 
                            }}
                          >
                            Valid Logos
                          </Typography>
                          <Typography 
                            variant="h3" 
                            sx={{ 
                              color: 'success.main',
                              fontWeight: 500,
                              lineHeight: 1
                            }}
                          >
                            {getBatchSummary(results).validCount}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'success.main',
                              mt: 1,
                              opacity: 0.8
                            }}
                          >
                            {getBatchSummary(results).successRate}% Success
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Invalid Logos */}
                      <Grid item xs={6} sm={4}>
                        <Paper 
                          sx={{ 
                            p: 2,
                            backgroundColor: 'rgba(211, 47, 47, 0.05)',
                            border: '1px solid rgba(211, 47, 47, 0.1)',
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: 'error.main',
                              mb: 1,
                              fontWeight: 500
                            }}
                          >
                            Invalid Logos
                          </Typography>
                          <Typography 
                            variant="h3" 
                            sx={{ 
                              color: 'error.main',
                              fontWeight: 500,
                              lineHeight: 1
                            }}
                          >
                            {getBatchSummary(results).invalidCount}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'error.main',
                              mt: 1,
                              opacity: 0.8
                            }}
                          >
                            {100 - getBatchSummary(results).successRate}% Failed
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Total Processed */}
                      <Grid item xs={12} sm={4}>
                        <Paper 
                          sx={{ 
                            p: 2,
                            backgroundColor: 'rgba(0, 102, 179, 0.05)',
                            border: `1px solid ${symphonyBlue}20`,
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: symphonyBlue,
                                mb: 1,
                                fontWeight: 500
                              }}
                            >
                              Total Processed
                            </Typography>
                            <Typography 
                              variant="h3" 
                              sx={{ 
                                color: symphonyBlue,
                                fontWeight: 500,
                                lineHeight: 1
                              }}
                            >
                              {getBatchSummary(results).total}
                            </Typography>
                          </Box>
                          <Box 
                            sx={{ 
                              width: 46,
                              height: 46,
                              borderRadius: '50%',
                              border: `2px solid ${symphonyBlue}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: symphonyWhite,
                              mt: 0.5
                            }}
                          >
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: symphonyBlue,
                                fontWeight: 500
                              }}
                            >
                              {getBatchSummary(results).successRate}%
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    px: { xs: 1.5, sm: 3 },
                    py: 2,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: symphonyBlue + '40',
                      borderRadius: '4px',
                      '&:hover': {
                        background: symphonyBlue + '60',
                      },
                    },
                  }}
                >
                  <Grid container spacing={{ xs: 2, sm: 2 }}> {/* Increased spacing for mobile */}
                    {results.map((result, index) => (
                      <Grid item xs={12} key={index}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            '&:hover': {
                              transform: { xs: 'none', sm: 'translateY(-2px)' }, // Disable hover effect on mobile
                              boxShadow: { xs: 'none', sm: '0 4px 8px rgba(0,0,0,0.1)' },
                            },
                          }}
                        >
                          <CardContent sx={{ 
                            p: { xs: 2, sm: 2 },
                            '&:last-child': { pb: { xs: 2, sm: 2 } } // Fix padding bottom
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: { xs: 2, sm: 2 },
                              flexDirection: { xs: 'row', sm: 'row' } // Keep row layout on mobile
                            }}>
                              {/* Status Icon */}
                              <Box 
                                sx={{ 
                                  backgroundColor: result.isValid ? 'success.main' : 'error.main',
                                  borderRadius: '50%',
                                  p: { xs: 1.5, sm: 1 }, // Larger padding on mobile
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  alignSelf: 'flex-start', // Always align to top
                                  flexShrink: 0 // Prevent icon from shrinking
                                }}
                              >
                                {result.isValid ? (
                                  <CheckCircleIcon sx={{ color: 'white', fontSize: { xs: 28, sm: 24 } }} />
                                ) : (
                                  <CancelIcon sx={{ color: 'white', fontSize: { xs: 28, sm: 24 } }} />
                                )}
                              </Box>

                              {/* Content */}
                              <Box sx={{ 
                                flex: 1,
                                minWidth: 0 // Allow text to wrap properly
                              }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  mb: 1,
                                  flexWrap: 'wrap' // Allow wrapping on mobile
                                }}>
                                  {inputMethod === 'upload' ? (
                                    <InsertDriveFileIcon sx={{ 
                                      mr: 1, 
                                      color: 'text.secondary',
                                      fontSize: { xs: 20, sm: 20 }
                                    }} />
                                  ) : (
                                    <LinkIcon sx={{ 
                                      mr: 1, 
                                      color: 'text.secondary',
                                      fontSize: { xs: 20, sm: 20 }
                                    }} />
                                  )}
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      fontWeight: 500,
                                      color: result.isValid ? 'success.dark' : 'error.dark',
                                      wordBreak: 'break-word',
                                      fontSize: { xs: '0.95rem', sm: '1rem' }
                                    }}
                                  >
                                    {result.name}
                                  </Typography>
                                </Box>

                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  flexWrap: 'wrap',
                                  gap: 1, 
                                  mt: 1 
                                }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      backgroundColor: result.isValid ? 'rgba(76, 175, 80, 0.2)' : 'rgba(211, 47, 47, 0.2)',
                                      py: { xs: 0.75, sm: 0.5 },
                                      px: { xs: 1.5, sm: 1 },
                                      borderRadius: 1,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      fontSize: { xs: '0.9rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <VerifiedIcon sx={{ fontSize: { xs: 18, sm: 16 }, mr: 0.5 }} />
                                    Status: {result.isValid ? 'Valid Logo Detected' : 'No Valid Logo Found'}
                                  </Typography>
                                </Box>

                                {result.message && result.message.includes('Error') && (
                                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ErrorOutlineIcon sx={{ 
                                      color: 'error.main', 
                                      fontSize: { xs: 20, sm: 20 } 
                                    }} />
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        color: 'error.main',
                                        fontStyle: 'italic',
                                        fontSize: { xs: '0.9rem', sm: '0.875rem' }
                                      }}
                                    >
                                      {result.message.split('(')[1]?.replace(')', '') || result.message}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  {results.length > 10 && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'center', 
                        mt: 2, 
                        color: 'text.secondary',
                        fontSize: { xs: '0.85rem', sm: '0.875rem' }
                      }}
                    >
                      Showing all {results.length} results. Scroll to view more.
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
