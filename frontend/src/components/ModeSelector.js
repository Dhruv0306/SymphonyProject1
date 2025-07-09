import React from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl, Typography, Box, Paper } from '@mui/material';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyWhite = '#FFFFFF';
const symphonyGray = '#333333';
const symphonyLightBlue = '#f0f9ff';

const ModeSelector = ({ mode, setMode, inputMethod, setInputMethod }) => {
  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Paper
          elevation={mode === 'single' ? 3 : 0}
          sx={{
            p: 2,
            backgroundColor: mode === 'single' ? symphonyLightBlue : symphonyWhite,
            border: `1px solid ${mode === 'single' ? symphonyBlue : symphonyBlue + '20'}`,
            borderRadius: 2,
            transition: 'all 0.3s ease'
          }}
        >
          <FormControlLabel
            value="single"
            control={
              <Radio
                sx={{
                  color: symphonyBlue,
                  '&.Mui-checked': {
                    color: symphonyBlue,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{
                  color: symphonyGray,
                  fontWeight: mode === 'single' ? 500 : 400
                }}>
                  Single Image
                </Typography>
                <Typography variant="body2" sx={{
                  color: symphonyGray,
                  opacity: 0.7,
                  fontSize: '0.8rem',
                  mt: 0.5
                }}>
                  Process one image at a time
                </Typography>
              </Box>
            }
            sx={{ margin: 0 }}
          />
        </Paper>

        <Paper
          elevation={mode === 'batch' ? 3 : 0}
          sx={{
            p: 2,
            backgroundColor: mode === 'batch' ? symphonyLightBlue : symphonyWhite,
            border: `1px solid ${mode === 'batch' ? symphonyBlue : symphonyBlue + '20'}`,
            borderRadius: 2,
            transition: 'all 0.3s ease'
          }}
        >
          <FormControlLabel
            value="batch"
            control={
              <Radio
                sx={{
                  color: symphonyBlue,
                  '&.Mui-checked': {
                    color: symphonyBlue,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{
                  color: symphonyGray,
                  fontWeight: mode === 'batch' ? 500 : 400
                }}>
                  Batch Processing
                </Typography>
                <Typography variant="body2" sx={{
                  color: symphonyGray,
                  opacity: 0.7,
                  fontSize: '0.8rem',
                  mt: 0.5
                }}>
                  Process multiple images at once
                </Typography>
              </Box>
            }
            sx={{ margin: 0 }}
          />
        </Paper>
      </RadioGroup>
    </FormControl>
  );
};

export default ModeSelector;