import React from 'react';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const ExportCsvButton = ({ results, onExportCSV }) => {
  if (results.length === 0) return null;

  return (
    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<FileDownloadIcon />}
        onClick={onExportCSV}
      >
        Export Results to CSV
      </Button>
    </Box>
  );
};

export default ExportCsvButton;