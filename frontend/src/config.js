/**
 * API Configuration Module
 * 
 * Centralizes API configuration settings for the application.
 * Supports environment-based configuration through environment variables.
 */

// Backend API URL configuration
// Uses REACT_APP_BACKEND_URL environment variable if set, otherwise falls back to default
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// WebSocket URL configuration
// Uses REACT_APP_WS_URL environment variable if set, otherwise derives from backend URL
const wsUrl = process.env.REACT_APP_WS_URL || backendUrl.replace(/^http/, 'ws');

// Export the base URL for API requests
export const API_BASE_URL = backendUrl;

// Export the WebSocket URL
export const WS_BASE_URL = wsUrl; 