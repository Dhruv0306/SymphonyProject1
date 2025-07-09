import axios from 'axios';
import { API_BASE_URL } from '../config';

export const singleApi = {
  // Process single image (file or URL)
  processSingleImage: async (formData) => {
    return axios.post(`${API_BASE_URL}/api/check-logo/single/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};