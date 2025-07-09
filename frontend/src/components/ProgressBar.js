import React from 'react';
import { Box, Typography, LinearProgress, CircularProgress, Paper } from '@mui/material';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyWhite = '#FFFFFF';

const ProgressBar = ({ loading, progress, formatTime }) => {
  if (!loading) return null;

  const isRetry = progress?.isRetry;
  const progressColor = isRetry ? 'orange' : symphonyBlue;

  return (
    <Paper
      sx={{
        p: 4,
        backgroundColor: symphonyWhite,
        borderRadius: 2,
        border: `1px solid ${symphonyBlue}20`
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <CircularProgress sx={{ color: symphonyBlue, width: '4rem !important', height: '4rem !important' }} />
      </Box>

      {progress && (
        <Box sx={{ width: '100%', mt: 3, mb: 3 }}>
          {isRetry && (
            <Typography variant="h6" color="warning.main" align="center" sx={{ fontSize: '1.4rem', mb: 2 }}>
              🔄 Retrying Failed Images
            </Typography>
          )}

          <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
            {isRetry ? progress.retryProgress : `Processing images: ${progress.processedImages} / ${progress.totalImages}`}
          </Typography>

          {/* Time information with larger text */}
          {!isRetry && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, my: 2 }}>
              <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
                Time elapsed: {progress.elapsedTime}
              </Typography>
              <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
                Est. time remaining: {progress.estimatedTimeRemaining}
              </Typography>
            </Box>
          )}

          {progress.failedChunks > 0 && !isRetry && (
            <Typography variant="h6" color="warning.main" align="center" sx={{ fontSize: '1.2rem', mb: 2 }}>
              ⚠️ {progress.failedChunks} chunks failed (can be retried)
            </Typography>
          )}

          <LinearProgress
            variant="determinate"
            value={progress.percent || progress.percentComplete || 0}
            sx={{
              mt: 2,
              mb: 2,
              height: 12,
              borderRadius: 6,
              backgroundColor: `rgba(${isRetry ? '255, 165, 0' : '0, 102, 179'}, 0.1)`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: progressColor,
                borderRadius: 6,
              }
            }}
          />
          <Typography variant="h6" color="text.secondary" align="center" sx={{ fontWeight: 500, fontSize: '1.4rem' }}>
            {Math.round(progress.percent || progress.percentComplete || 0)}% complete
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ProgressBar;