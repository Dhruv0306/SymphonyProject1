import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * Theme constants for consistent Symphony branding
 */
const symphonyBlue = '#0066B3';
const symphonyWhite = '#FFFFFF';

const ResultRenderer = ({ loading, results, mode }) => {
  if (loading || results.length === 0) return null;

  return (
    <Paper
      sx={{
        backgroundColor: symphonyWhite,
        borderRadius: 2,
        height: { xs: 'auto', sm: 'calc(100vh - 400px)' },
        maxHeight: { xs: '100%', sm: 'calc(100vh - 400px)' },
        minHeight: { xs: '400px', sm: '500px' },
        display: 'flex',
        flexDirection: 'column',
        mt: { xs: 2, sm: 3 },
        position: { xs: 'relative', sm: 'sticky' },
        bottom: { xs: 'auto', sm: 0 },
        zIndex: 1,
        boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Results header */}
      <Box
        sx={{
          borderBottom: `1px solid ${symphonyBlue}20`,
          backgroundColor: symphonyWhite,
          position: 'sticky',
          top: 0,
          zIndex: 2,
          p: { xs: 3, sm: 2 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: symphonyBlue,
            fontWeight: 500,
            fontSize: '1.4rem'
          }}
        >
          Results ({results.length} {results.length === 1 ? 'image' : 'images'})
        </Typography>
        {mode === 'batch' && (
          <Typography
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: '1rem'
            }}
          >
            <Box component="span" sx={{
              display: 'inline-flex',
              alignItems: 'center',
              color: 'success.main'
            }}>
              <CheckCircleIcon sx={{ fontSize: '2.8rem', mr: 1 }} />
              {results.filter(r => r.isValid).length} Valid
            </Box>
            <Box component="span" sx={{ mx: 2 }}>•</Box>
            <Box component="span" sx={{
              display: 'inline-flex',
              alignItems: 'center',
              color: 'error.main'
            }}>
              <CancelIcon sx={{ fontSize: '2.8rem', mr: 1 }} />
              {results.filter(r => !r.isValid).length} Invalid
            </Box>
          </Typography>
        )}
      </Box>

      {/* Results list */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: { xs: 2, sm: 3 },
        pt: 0
      }}>
        <Grid container spacing={2}>
          {results.map((result, index) => (
            <Grid xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: result.isValid ? 'rgba(76, 175, 80, 0.05)' : 'rgba(211, 47, 47, 0.05)',
                  border: `1px solid ${result.isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(211, 47, 47, 0.1)'}`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: '100%'
                }}
              >
                {result.isValid ? (
                  <CheckCircleIcon sx={{
                    color: 'success.main',
                    fontSize: '2.5rem'
                  }} />
                ) : (
                  <CancelIcon sx={{
                    color: 'error.main',
                    fontSize: '2.5rem'
                  }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{
                    color: result.isValid ? 'success.main' : 'error.main',
                    fontWeight: 500,
                    fontSize: '1.1rem',
                    mb: 0.5
                  }}>
                    {result.isValid ? 'Valid Logo' : 'Invalid Logo'}
                  </Typography>
                  <Typography sx={{
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {result.name}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default ResultRenderer;