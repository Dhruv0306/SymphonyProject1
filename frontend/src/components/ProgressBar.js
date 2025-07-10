/**
 * Progress Bar Component
 * 
 * Renders a visually appealing progress indicator for batch processing operations
 * with time estimates, completion percentage, and processing status. The component
 * supports both normal processing and retry modes with appropriate visual differentiation.
 * 
 * Features:
 * - Visual progress tracking with linear and circular indicators
 * - Processing statistics display (processed/total items)
 * - Time tracking with elapsed and estimated remaining time
 * - Support for retry phase with distinct styling
 * - Failed chunk tracking and notification
 * 
 * @module ProgressBar
 * @author Symphony AI Team
 * @version 1.2.0
 */

import React from 'react';
import { Box, Typography, LinearProgress, CircularProgress, Paper } from '@mui/material';

/**
 * Theme constants for consistent Symphony branding across the application
 */
const symphonyBlue = '#0066B3';
const symphonyWhite = '#FFFFFF';

/**
 * Renders a progress bar with statistics for batch processing operations.
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.loading - Whether the process is currently loading/active
 * @param {Object} props.progress - Progress data object
 * @param {boolean} props.progress.isRetry - Whether the process is in retry mode
 * @param {number} props.progress.processedImages - Number of processed images
 * @param {number} props.progress.totalImages - Total number of images
 * @param {string} props.progress.elapsedTime - Formatted elapsed time string
 * @param {string} props.progress.estimatedTimeRemaining - Formatted estimated remaining time
 * @param {number} props.progress.failedChunks - Number of failed chunks
 * @param {number} props.progress.percent - Completion percentage (0-100)
 * @param {string} props.progress.retryProgress - Retry phase progress text
 * @returns {JSX.Element|null} Progress bar component or null if not loading
 */
const ProgressBar = ({ loading, progress, formatTime }) => {
  // Don't render anything if not in loading state
  if (!loading) return null;

  // Determine color scheme based on process mode (normal vs retry)
  const isRetry = progress?.isRetry;
  const progressColor = isRetry ? 'orange' : symphonyBlue;

  return (
    <Paper
      sx={{
        p: 4,
        backgroundColor: symphonyWhite,
        borderRadius: 2,
        border: `1px solid ${symphonyBlue}20` // Subtle border for visual definition
      }}
    >
      {/* Circular spinner animation */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <CircularProgress sx={{ color: symphonyBlue, width: '4rem !important', height: '4rem !important' }} />
      </Box>

      {/* Progress information display */}
      {progress && (
        <Box sx={{ width: '100%', mt: 3, mb: 3 }}>
          {/* Retry phase notification */}
          {isRetry && (
            <Typography variant="h6" color="warning.main" align="center" sx={{ fontSize: '1.4rem', mb: 2 }}>
              🔄 Retrying Failed Images
            </Typography>
          )}

          {/* Processing progress counter */}
          <Typography variant="h6" color="text.secondary" align="center" sx={{ fontSize: '1.4rem' }}>
            {isRetry ? progress.retryProgress : `Processing images: ${progress.processedImages} / ${progress.totalImages}`}
          </Typography>

          {/* Time information display */}
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

          {/* Failed chunks warning */}
          {progress.failedChunks > 0 && !isRetry && (
            <Typography variant="h6" color="warning.main" align="center" sx={{ fontSize: '1.2rem', mb: 2 }}>
              ⚠️ {progress.failedChunks} chunks failed (can be retried)
            </Typography>
          )}

          {/* Linear progress bar visualization */}
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
          
          {/* Percentage completion display */}
          <Typography variant="h6" color="text.secondary" align="center" sx={{ fontWeight: 500, fontSize: '1.4rem' }}>
            {Math.round(progress.percent || progress.percentComplete || 0)}% complete
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ProgressBar;