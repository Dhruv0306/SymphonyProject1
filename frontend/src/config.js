/**
 * API Configuration Module
 *
 * Centralizes API configuration settings for the application.
 * Supports environment-based configuration through environment variables.
 *
 * Usage:
 *   import { API_BASE_URL, WS_BASE_URL } from './config';
 *
 * Environment Variables:
 *   - REACT_APP_BACKEND_URL: (string) The base URL for backend API requests.
 *   - REACT_APP_WS_URL: (string) The WebSocket URL for real-time communication.
 *
 * In production, set these environment variables to point to your deployed backend and WebSocket servers.
 */

// Backend API URL configuration
// Uses REACT_APP_BACKEND_URL environment variable if set, otherwise falls back to default (for development)
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// WebSocket URL configuration
// Uses REACT_APP_WS_URL environment variable if set, otherwise derives from backend URL
const wsUrl = process.env.REACT_APP_WS_URL || backendUrl.replace(/^http/, 'ws');

/**
 * The base URL for API requests.
 * @type {string}
 * @example
 * // In production, set REACT_APP_BACKEND_URL to your API endpoint.
 * // e.g., 'https://api.example.com'
 */
export const API_BASE_URL = backendUrl;

/**
 * The WebSocket base URL for real-time features.
 * @type {string}
 * @example
 * // In production, set REACT_APP_WS_URL to your WebSocket endpoint.
 * // e.g., 'wss://ws.example.com'
 */
export const WS_BASE_URL = wsUrl;