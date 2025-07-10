/**
 * API Utility Module
 * 
 * Provides robust helper functions for making authenticated API requests to the Symphony
 * Logo Detection backend with proper security headers, error handling, and CSRF protection.
 * This module centralizes API communication logic to ensure consistent request handling
 * and error management across the application.
 * 
 * Features:
 * - Automatic CSRF token inclusion for non-GET requests
 * - Consistent error handling and response parsing
 * - Integration with application configuration
 * - Credential management for authenticated requests
 * 
 * Usage:
 * ```
 * import { apiRequest, handleApiResponse } from '../utils/api';
 * 
 * // Example GET request
 * const fetchData = async () => {
 *   const response = await apiRequest('/api/endpoint');
 *   const data = await handleApiResponse(response);
 *   return data;
 * };
 * 
 * // Example POST request with body
 * const submitData = async (payload) => {
 *   const response = await apiRequest('/api/endpoint', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload)
 *   });
 *   return handleApiResponse(response);
 * };
 * ```
 * 
 * @module api
 * @author Symphony AI Team
 * @version 1.1.0
 */

import { API_BASE_URL } from '../config';

/**
 * Makes an authenticated API request with CSRF protection.
 * 
 * This function wraps the native fetch API to provide consistent request handling:
 * - Automatically prepends the API base URL to the endpoint
 * - Includes CSRF token for non-GET requests if available
 * - Sets credentials mode to 'include' for session cookie handling
 * 
 * @param {string} url - API endpoint URL (without the base URL)
 * @param {Object} options - Fetch API options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object} options.headers - HTTP headers to include in the request
 * @param {string|FormData|Object} options.body - Request body data
 * @returns {Promise<Response>} - Fetch API Response object
 * 
 * @example
 * // Simple GET request
 * const response = await apiRequest('/api/check-logo/batch-history');
 * 
 * @example
 * // POST request with JSON body
 * const response = await apiRequest('/api/check-logo/single/url', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ image_path: 'https://example.com/image.jpg' })
 * });
 */
export const apiRequest = async (url, options = {}) => {
  // Get CSRF token from localStorage
  const csrfToken = localStorage.getItem('csrf_token');
  
  // Set default headers
  const headers = {
    ...options.headers,
  };
  
  // Add CSRF token if available and not a GET request
  if (csrfToken && options.method && options.method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Make the request
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    // amazonq-ignore-next-line
    credentials: 'include', // Always include credentials for authenticated requests
  });
};

/**
 * Handles API response with JSON parsing and standardized error handling.
 * 
 * This function processes API responses to:
 * - Parse successful JSON responses
 * - Extract and format error messages from failed requests
 * - Handle non-JSON responses appropriately
 * 
 * @param {Response} response - Fetch API Response object
 * @returns {Promise<Object>} - Promise resolving to parsed response data
 * @throws {Error} - Error with details from the API response
 * 
 * @example
 * try {
 *   const response = await apiRequest('/api/endpoint');
 *   const data = await handleApiResponse(response);
 *   // Process successful response
 * } catch (error) {
 *   // Handle error with message from API
 *   console.error(error.message);
 * }
 */
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    // Try to parse error response
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API error: ${response.status}`);
    } catch (e) {
      throw new Error(`API error: ${response.status}`);
    }
  }
  
  // For successful responses, parse JSON if content exists
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return { success: true };
};