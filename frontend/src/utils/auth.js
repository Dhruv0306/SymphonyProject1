/**
 * Authentication Utility Functions
 * 
 * Provides helper functions for authentication and session management
 */

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return localStorage.getItem('auth_token') !== null;
};

/**
 * Get the authentication token
 * @returns {string|null} The authentication token or null if not authenticated
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Get the CSRF token
 * @returns {string|null} The CSRF token or null if not available
 */
export const getCsrfToken = () => {
  return localStorage.getItem('csrf_token');
};

/**
 * Set authentication tokens
 * @param {string} authToken - The authentication token
 * @param {string} csrfToken - The CSRF token
 */
export const setAuthTokens = (authToken, csrfToken) => {
  localStorage.setItem('auth_token', authToken);
  if (csrfToken) {
    localStorage.setItem('csrf_token', csrfToken);
  }
};

/**
 * Clear authentication tokens
 */
export const clearAuthTokens = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('csrf_token');
};

/**
 * Get authentication headers for API requests
 * @param {boolean} includeCSRF - Whether to include CSRF token
 * @returns {Object} Headers object with authentication tokens
 */
export const getAuthHeaders = (includeCSRF = false) => {
  const headers = {};
  const authToken = getAuthToken();
  
  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }
  
  if (includeCSRF) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return headers;
};