/**
 * API Configuration Module
 * 
 * Centralizes API configuration settings for the application.
 * Supports environment-based configuration through environment variables.
 */

// Backend API URL configuration
// Uses REACT_APP_BACKEND_URL environment variable if set, otherwise falls back to default
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://10.1.5.23:8000';

// Export the base URL for API requests
export const API_BASE_URL = backendUrl; 