/**
 * Application Entry Point
 * 
 * This file initializes the React application, applies the custom MUI theme,
 * and sets up performance monitoring. It also disables warnings before any
 * other imports.
 * 
 * In production, ensure that:
 * - Debugging tools and verbose logging are disabled.
 * - reportWebVitals is configured to send metrics to your analytics endpoint.
 * - Any development-only code is removed or guarded by environment checks.
 */

import './disableWarnings'; // Import first to disable warnings (see disableWarnings.js for details)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global styles
import App from './App'; // Main application component
import reportWebVitals from './reportWebVitals'; // Performance monitoring
import { ThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Create a custom Material-UI theme using Symphony brand colors.
 * Adjust the palette, shape, and component overrides as needed.
 * 
 * In production, consider extracting theme configuration to a separate file
 * for easier maintenance and reuse.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066B3', // Symphony Blue
      light: '#4B9FE1',
      dark: '#004C8C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#005299',
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
      primary: '#333333',
      secondary: '#666666',
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

/**
 * Create the root element for the React application.
 * 
 * In production, ensure the root element exists in your HTML template.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Render the application wrapped in ThemeProvider and StrictMode.
 * 
 * In production, you may remove React.StrictMode for performance,
 * but it is recommended during development for highlighting potential issues.
 */
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

/**
 * Initialize performance monitoring.
 * 
 * In production, configure reportWebVitals to send metrics to your analytics endpoint.
 * Example:
 *   reportWebVitals(metric => sendToAnalytics(metric));
 */
reportWebVitals();