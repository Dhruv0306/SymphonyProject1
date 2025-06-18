import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
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

  useEffect(() => {
    const fetchBatchHistory = async () => {
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
    
    fetchBatchHistory();
  }, []);

  const handleDownload = (downloadUrl) => {
    const token = localStorage.getItem('auth_token');
    
    // Create a temporary link with the auth token as a query parameter
    const url = new URL(`${API_BASE_URL}${downloadUrl}`);
    url.searchParams.append('token', token);
    
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
      <Typography variant="h5" sx={{ mb: 3 }}>
        Batch Processing History
      </Typography>
      
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
                      />
                      <Chip 
                        label={`${batch.invalid_count} Invalid`} 
                        size="small" 
                        color="error" 
                        variant="outlined" 
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{formatFileSize(batch.file_size)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => console.log('View details for', batch.batch_id)}
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
    </Paper>
  );
};

export default BatchHistory;