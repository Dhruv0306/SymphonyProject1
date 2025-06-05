/**
 * Application Entry Point
 * 
 * Initializes the React application and sets up the root component.
 * Includes performance monitoring through web vitals.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create root element for React application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application with StrictMode for additional development checks
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize performance monitoring
// To measure performance, pass a function to log results (e.g., reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
