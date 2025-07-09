import axios from 'axios';
import { API_BASE_URL } from '../config';

export const batchApi = {
  // Single image processing
  processSingleImage: async (formData) => {
    return axios.post(`${API_BASE_URL}/api/check-logo/single/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Start batch processing
  startBatch: async (formData) => {
    return axios.post(`${API_BASE_URL}/api/start-batch`, formData);
  },

  // Initialize batch tracking
  initializeBatchTracking: async (batchId, clientId, total) => {
    return axios.post(`${API_BASE_URL}/api/init-batch`, {
      batch_id: batchId,
      client_id: clientId,
      total: total
    });
  },

  // Process batch files
  processBatchFiles: async (formData) => {
    return axios.post(`${API_BASE_URL}/api/check-logo/batch/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Process batch URLs
  processBatchUrls: async (data) => {
    return axios.post(`${API_BASE_URL}/api/check-logo/batch/`, JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
  },

  // Complete batch processing
  completeBatch: async (batchId) => {
    return axios.post(`${API_BASE_URL}/api/check-logo/batch/${batchId}/complete`);
  },

  // Export CSV
  exportCSV: async (batchId) => {
    return fetch(`${API_BASE_URL}/api/check-logo/batch/export-csv?batch_id=${batchId}`, {
      method: 'GET'
    });
  }
};