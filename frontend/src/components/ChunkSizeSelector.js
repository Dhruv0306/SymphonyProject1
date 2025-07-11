import React from 'react';
import { Box, Typography, Slider, Button } from '@mui/material';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyWhite = '#FFFFFF';
const symphonyGray = '#333333';
const symphonyLightBlue = '#f0f9ff';

const ChunkSizeSelector = ({ 
  displayValue, 
  onValueChange, 
  onPresetClick 
}) => {
  return (
    <>
      <Typography
        variant="subtitle1"
        sx={{
          color: symphonyBlue,
          fontWeight: 500,
          mt: 1,
          textAlign: 'center',
          width: '100%'
        }}
      >
        Batch Size: {displayValue} images
      </Typography>
      <Box sx={{
        width: '100%',
        px: 3,
        mt: 2,
        mb: 2
      }}>
        <Slider
          value={displayValue}
          onChange={(_, value) => onValueChange(value)}
          min={1}
          max={100}
          step={1}
          marks={[
            { value: 1, label: '1' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 100, label: '100' }
          ]}
          sx={{
            color: symphonyBlue,
            height: 8,
            '& .MuiSlider-thumb': {
              height: 24,
              width: 24,
              backgroundColor: symphonyWhite,
              border: `2px solid ${symphonyBlue}`,
              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                boxShadow: 'inherit',
              },
            },
            '& .MuiSlider-track': {
              height: 8,
              backgroundColor: symphonyBlue,
            },
            '& .MuiSlider-rail': {
              height: 8,
              backgroundColor: `${symphonyBlue}20`,
            },
            '& .MuiSlider-mark': {
              backgroundColor: symphonyBlue,
              height: 8,
            },
            '& .MuiSlider-markLabel': {
              color: symphonyGray,
              fontSize: '0.875rem',
              fontWeight: 500,
              marginTop: 4,
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: symphonyBlue,
            }
          }}
          valueLabelDisplay="auto"
          aria-label="Batch size slider"
        />
      </Box>
      <Box sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        width: '100%'
      }}>
        {[10, 25, 50, 100].map((value) => (
          <Button
            key={value}
            variant="outlined"
            size="small"
            onClick={() => onPresetClick(value)}
            sx={{
              borderColor: symphonyBlue,
              color: symphonyBlue,
              '&:hover': {
                backgroundColor: symphonyLightBlue,
                borderColor: symphonyBlue,
              },
              minWidth: '60px'
            }}
          >
            {value}
          </Button>
        ))}
      </Box>
    </>
  );
};

export default ChunkSizeSelector;