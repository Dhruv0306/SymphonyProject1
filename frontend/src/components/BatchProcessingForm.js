import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress,
  Typography,
  Alert
} from '@mui/material';
import EmailInput from './EmailInput';
import { API_BASE_URL } from '../config';

/**
 * Batch processing form component with email notification
 */
const BatchProcessingForm = ({ onBatchStart }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  const handleStartBatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create form data for submission
      const formData = new FormData();
      
      // Add email if provided
      if (email.trim()) {
        formData.append('email', email.trim());
      }
      
      // amazonq-ignore-next-line
      const response = await fetch(`${API_BASE_URL}/api/start-batch`, {
        method: 'POST',
        body: formData,
        // amazonq-ignore-next-line
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onBatchStart) {
          onBatchStart(data.batch_id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start batch');
      }
    } catch (err) {
      setError('An error occurred while starting the batch');
      console.error('Start batch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
        Start a new batch processing job to monitor progress in real-time.
      </Typography>
      
      <EmailInput 
        email={email}
        setEmail={setEmail}
      />
      
      <Button
        variant="contained"
        onClick={handleStartBatch}
        disabled={loading}
        sx={{ 
          bgcolor: '#0066B3',
          mt: 2,
          minWidth: '200px'
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Start New Batch'}
      </Button>
    </Box>
  );
};

export default BatchProcessingForm;