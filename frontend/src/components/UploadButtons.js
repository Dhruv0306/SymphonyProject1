import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyDarkBlue = '#005299';
const symphonyWhite = '#FFFFFF';
const symphonyLightBlue = '#f0f9ff';

const UploadButtons = ({ 
  mode, 
  loading, 
  onSubmit, 
  onStartBatch 
}) => {
  return (
    <>
      {mode === 'batch' && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={onStartBatch}
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
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          onClick={onSubmit}
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
    </>
  );
};

export default UploadButtons;