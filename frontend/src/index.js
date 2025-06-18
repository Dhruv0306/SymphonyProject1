/**
 * Application Entry Point
 */
import './disableWarnings'; // Import first to disable warnings
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

// Create root element for React application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application with ThemeProvider
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Initialize performance monitoring
reportWebVitals();