// src/FileUploader.js
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';

const FileUploader = ({ onFilesSelected }) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(files);
  };

  return (
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
  );
};

export default FileUploader;