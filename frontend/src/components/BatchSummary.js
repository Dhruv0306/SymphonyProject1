import React from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';
import { formatTime } from '../utils/timeFormatter';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyLightBlue = '#f0f9ff';

const BatchSummary = ({ mode, processSummary, results }) => {
  if (mode !== 'batch' || !processSummary) return null;



  const validCount = results.filter(r => r.isValid).length;
  const successRate = results.length > 0 ? (validCount / results.length) * 100 : 0;

  return (
    <Paper sx={{
      p: 3,
      mt: 3,
      backgroundColor: symphonyLightBlue,
      border: `1px solid ${symphonyBlue}20`
    }}>
      <Typography variant="h6" sx={{ color: symphonyBlue, mb: 2 }}>
        Processing Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid xs={12} sm={6} md={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Images
            </Typography>
            <Typography variant="h4" sx={{ color: symphonyBlue }}>
              {processSummary.totalImages}
            </Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Time
            </Typography>
            <Typography variant="h4" sx={{ color: symphonyBlue }}>
              {formatTime(processSummary.totalTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Processing speed: {processSummary.totalTime > 0 ? (processSummary.totalImages / (processSummary.totalTime / 1000)).toFixed(2) : '0'} images/sec
            </Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Success Rate
            </Typography>
            <Typography variant="h4" sx={{ color: symphonyBlue }}>
              {successRate.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {validCount} valid / {results.filter(r => !r.isValid).length} invalid
            </Typography>
          </Box>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Avg. Time per Image
            </Typography>
            <Typography variant="h4" sx={{ color: symphonyBlue }}>
              {formatTime(processSummary.averageTimePerImage)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Min: {processSummary.totalImages > 0 ? formatTime(processSummary.totalTime / processSummary.totalImages) : '0s'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BatchSummary;