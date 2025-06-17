/**
 * Application Entry Point
 * 
 * Initializes the React application and sets up the root component.
 * Includes performance monitoring through web vitals and custom analytics.
 * 
 * Updated to support the latest YOLO model architecture and API v2 endpoints.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create theme with Symphony brand colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066B3', // Symphony Blue
      light: '#4B9FE1',
      dark: '#004C8C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#005299', // Darker blue for hover states
      light: '#4B7FB3',
      dark: '#003A6B',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC3545',
    },
    warning: {
      main: '#FFC107',
    },
    success: {
      main: '#28A745',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333', // Symphony Gray
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          height: 10,
        },
        bar: {
          borderRadius: 5,
        },
      },
    },
  },
});

// Create root element for React application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application with ThemeProvider and StrictMode
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Initialize performance monitoring with custom analytics
reportWebVitals(({ name, delta, id }) => {
  // Send metrics to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    try {
      fetch('/api/v2/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value: delta,
          id: id,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
});
