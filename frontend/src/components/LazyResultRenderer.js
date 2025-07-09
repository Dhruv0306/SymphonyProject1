import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy load the heavy ResultRenderer component
const ResultRenderer = lazy(() => import('./ResultRenderer'));

const LazyResultRenderer = ({ loading, results, mode }) => {
  // Only lazy load for large result sets (>100 items)
  if (results.length <= 100) {
    const ResultRendererSync = require('./ResultRenderer').default;
    return <ResultRendererSync loading={loading} results={results} mode={mode} />;
  }

  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#0066B3' }} />
      </Box>
    }>
      <ResultRenderer loading={loading} results={results} mode={mode} />
    </Suspense>
  );
};

export default LazyResultRenderer;