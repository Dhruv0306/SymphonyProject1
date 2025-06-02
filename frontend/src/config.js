// Get the backend URL from environment variable or use localhost as default
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const API_BASE_URL = backendUrl; 