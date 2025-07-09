import React from 'react';
import { Paper, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const WsStatusBanner = ({ error }) => {
  if (!error) return null;

  return (
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
  );
};

export default WsStatusBanner;