import React from 'react';
import { Box, Paper, TextField, useTheme, useMediaQuery } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyWhite = '#FFFFFF';

const UrlInputForm = ({ 
  mode, 
  imageUrl, 
  batchUrls, 
  onUrlChange, 
  onBatchUrlsChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: symphonyWhite,
          height: { xs: mode === 'batch' ? '200px' : 'auto', sm: mode === 'batch' ? '250px' : 'auto' }
        }}
      >
        {mode === 'single' ? (
          <TextField
            fullWidth
            label="Image URL"
            value={imageUrl}
            onChange={onUrlChange}
            placeholder="Enter the URL of the image"
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            InputProps={{
              startAdornment: <LinkIcon sx={{ color: symphonyBlue, mr: 1 }} />,
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              },
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: symphonyBlue,
                },
                '&.Mui-focused fieldset': {
                  borderColor: symphonyBlue,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: symphonyBlue,
              }
            }}
          />
        ) : (
          <Box sx={{ height: '100%' }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Image URLs"
              value={batchUrls}
              onChange={onBatchUrlsChange}
              placeholder="Enter one URL per line"
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: <LinkIcon sx={{ color: symphonyBlue, mr: 1, alignSelf: 'flex-start', mt: 1 }} />,
              }}
              sx={{
                height: '100%',
                '& .MuiInputBase-root': {
                  height: '100%',
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  overflow: 'auto !important',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                },
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: symphonyBlue,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: symphonyBlue,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: symphonyBlue,
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UrlInputForm;