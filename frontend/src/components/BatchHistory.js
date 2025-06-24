import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_BASE_URL } from '../config';

/**
 * Batch History Component
 * 
 * Displays a list of all processed batches with download options
 */
const BatchHistory = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchBatchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/batch-history`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch batch history');
      }
    } catch (err) {
      setError('An error occurred while fetching batch history');
      console.error('Fetch batch history error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBatchHistory();
  }, []);

  const handleDownload = (downloadUrl) => {
    const token = localStorage.getItem('auth_token');
    
    // Create a temporary link with the auth token as a query parameter
    const url = new URL(`${API_BASE_URL}${downloadUrl}`);
    url.searchParams.append('token', token);
    
    // Open in a new tab to trigger the download
    window.open(url.toString(), '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Empty function to handle chip clicks (prevents errors)
  const handleChipClick = () => {};
  
  // Function to handle preview
  const handlePreview = async (batchId) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/batch/${batchId}/preview`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview || []);
      } else {
        console.error('Failed to fetch preview data');
        setPreviewData([]);
      }
    } catch (err) {
      console.error('Error fetching preview:', err);
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Batch Processing History
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={fetchBatchHistory}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>
      
      {batches.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
          No batch history found.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Results</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.batch_id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {batch.batch_id}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(batch.created_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`${batch.valid_count} Valid`} 
                        size="small" 
                        color="success" 
                        variant="outlined" 
                        onClick={handleChipClick}
                      />
                      <Chip 
                        label={`${batch.invalid_count} Invalid`} 
                        size="small" 
                        color="error" 
                        variant="outlined" 
                        onClick={handleChipClick}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{formatFileSize(batch.file_size)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Preview Results">
                        <IconButton 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => handlePreview(batch.batch_id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Download CSV">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleDownload(batch.download_url)}
                        >
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Batch Results Preview
        </DialogTitle>
        <DialogContent>
          {previewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewData.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2 }}>
              No results available for preview.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, i) => (
                        <TableCell key={i}>
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default BatchHistory;