/**
 * API Utility Functions
 * 
 * Provides helper functions for making API requests with proper security headers
 */

import { API_BASE_URL } from '../config';

/**
 * Make an authenticated API request with CSRF protection
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
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
    credentials: 'include', // Always include credentials for authenticated requests
  });
};

/**
 * Handle API response with JSON parsing and error handling
 * 
 * @param {Response} response - Fetch response object
 * @returns {Promise} - Promise resolving to JSON data or error
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