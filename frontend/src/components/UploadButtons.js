import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyDarkBlue = '#005299';
const symphonyWhite = '#FFFFFF';

const UploadButtons = ({
  mode,
  loading,
  onSubmit}) => {
  return (
    <>
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
            `Process Image${mode === 'batch' ? 's' : ''}`
          )}
        </Button>
      </Box>    </>
  );
};

export default UploadButtons;