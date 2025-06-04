// Get the backend URL from environment variable or use the correct IP as default
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://10.1.5.23:8000';

export const API_BASE_URL = backendUrl; 