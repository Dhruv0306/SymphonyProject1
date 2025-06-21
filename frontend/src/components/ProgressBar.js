import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Paper,
  Grid
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { API_BASE_URL, WS_BASE_URL } from '../config';

/**
 * Real-time progress bar component using WebSocket connection
 * 
 * @param {Object} props Component props
 * @param {string} props.batchId The batch ID to track
 */
const ProgressBar = ({ batchId }) => {
  const [progress, setProgress] = useState({
    processed: 0,
    valid: 0,
    invalid: 0,
    percent_complete: 0,
    current_file: null,
    error: null,
    status: 'processing',
    total: 0
  });
  
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectWebSocket = () => {
      // Close existing connection if any
      if (ws) {
        ws.close();
      }
      
      // Create new WebSocket connection
      ws = new WebSocket(`${WS_BASE_URL}/ws/batch/${batchId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttempts = 0;
        
        if (!startTime) {
          setStartTime(Date.now());
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress(prevProgress => ({
            ...prevProgress,
            ...data
          }));
          
          // If status is completed, close the connection
          if (data.status === 'completed') {
            ws.close();
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error. Attempting to reconnect...');
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event);
        setConnected(false);
        
        // Attempt to reconnect unless we've reached max attempts or processing is complete
        if (reconnectAttempts < maxReconnectAttempts && progress.status !== 'completed') {
          reconnectAttempts++;
          const timeout = Math.min(1000 * reconnectAttempts, 5000);
          console.log(`Reconnecting in ${timeout}ms (attempt ${reconnectAttempts})`);
          
          setTimeout(connectWebSocket, timeout);
        }
      };
    };
    
    // Initial connection
    if (batchId) {
      connectWebSocket();
      setStartTime(Date.now());
    }
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [batchId]);
  
  // Calculate elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    let interval;
    
    if (startTime && progress.status !== 'completed') {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [startTime, progress.status]);
  
  // Format time as mm:ss or hh:mm:ss
  const formatTime = (seconds) => {
    if (seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate estimated time remaining
  const estimatedTimeRemaining = () => {
    if (progress.processed === 0 || progress.percent_complete === 0) {
      return 'Calculating...';
    }
    
    const processedPerSecond = progress.processed / elapsedTime;
    const remaining = progress.total - progress.processed;
    const remainingSeconds = Math.floor(remaining / processedPerSecond);
    
    if (remainingSeconds < 0 || !isFinite(remainingSeconds)) {
      return 'Calculating...';
    }
    
    return formatTime(remainingSeconds);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Batch Progress: {progress.processed} / {progress.total || '?'} Images
          </Typography>
          <Typography variant="h6">
            {Math.round(progress.percent_complete)}%
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress.percent_complete} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            mb: 2
          }}
        />
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography>
                Valid: {progress.valid}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CancelIcon color="error" sx={{ mr: 1 }} />
              <Typography>
                Invalid: {progress.invalid}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography>
              Elapsed: {formatTime(elapsedTime)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography>
              Remaining: {estimatedTimeRemaining()}
            </Typography>
          </Grid>
        </Grid>
        
        {progress.current_file && (
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Currently processing: {progress.current_file}
          </Typography>
        )}
        
        {!connected && progress.status !== 'completed' && (
          <Typography color="warning.main" sx={{ mt: 2 }}>
            {error || 'Connecting to server...'}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ProgressBar;