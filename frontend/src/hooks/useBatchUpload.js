import { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { WebSocketManager } from '../utils/WebSocketManager';
import { uploadReducer, initialUploadState, UPLOAD_ACTIONS } from './uploadReducer';
import { batchApi } from '../api/batchApi';
import { formatTime as utilFormatTime } from '../utils/timeFormatter';
import { decodeUrl } from '../utils/urlDecoder';

export const useBatchUpload = (clientId) => {
  // State management with reducer for complex upload states
  const [uploadState, dispatch] = useReducer(uploadReducer, initialUploadState);
  const [progress, setProgress] = useState(null);
  const [processSummary, setProcessSummary] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Refs
  const processStartTimeRef = useRef(null);
  const batchRunningRef = useRef(false);
  const wsManagerRef = useRef(null);
  const handlersRef = useRef({});

  // Time formatting utility
  const formatTime = useCallback(utilFormatTime, []);
  // Enhanced state setters using reducer
  const setUploadStatuses = useCallback((statusOrUpdater) => {
    if (typeof statusOrUpdater === 'function') {
      // Handle function updates
      const currentStatuses = uploadState.uploadStatuses;
      const newStatuses = statusOrUpdater(currentStatuses);
      Object.entries(newStatuses).forEach(([key, status]) => {
        if (currentStatuses[key] !== status) {
          dispatch({ type: UPLOAD_ACTIONS.SET_UPLOAD_STATUS, payload: { key, status } });
        }
      });
    } else {
      // Handle direct object updates
      Object.entries(statusOrUpdater).forEach(([key, status]) => {
        dispatch({ type: UPLOAD_ACTIONS.SET_UPLOAD_STATUS, payload: { key, status } });
      });
    }
  }, [uploadState.uploadStatuses]);

  const setError = useCallback((error) => {
    dispatch({ type: UPLOAD_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const setResults = useCallback((results) => {
    dispatch({ type: UPLOAD_ACTIONS.SET_RESULTS, payload: results });
  }, []);

  // Update handlers ref
  handlersRef.current.setUploadStatuses = setUploadStatuses;
  handlersRef.current.setError = setError;

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message:', data);

    if (data.event === 'progress') {
      const currentTime = Date.now();
      const elapsedTime = processStartTimeRef.current ? currentTime - processStartTimeRef.current : 0;
      const estimatedTimeRemaining = (data.processed > 0 && elapsedTime > 0) ?
        ((data.total - data.processed) * elapsedTime) / data.processed : 0;

      setProgress({
        processedImages: data.processed,
        totalImages: data.total,
        currentChunk: (data.chunk_index || 0) + 1,
        totalChunks: data.total_chunks || 1,
        percent: data.percentage,
        elapsedTime: elapsedTime > 0 ? utilFormatTime(elapsedTime) : '0s',
        estimatedTimeRemaining: estimatedTimeRemaining > 0 ? utilFormatTime(estimatedTimeRemaining) : 'Calculating...'
      });

      const currentFile = data.current_file || decodeUrl(data.current_url) || '';
      if (data.current_status === "Valid") {
        handlersRef.current.setUploadStatuses((prev) => ({ ...prev, [currentFile]: "valid" }));
      } else {
        handlersRef.current.setUploadStatuses((prev) => ({ ...prev, [currentFile]: "invalid" }));
      }
    } else if (data.event === 'retry_start') {
      setProgress({
        isRetry: true,
        retryProgress: `Starting retry for ${data.retry_total} failed requests...`,
        percent: 0
      });
    } else if (data.event === 'complete') {
      setBatchRunning(false);
      batchRunningRef.current = false;
      setProgress(null);
      const processEndTime = Date.now();
      setProcessSummary({
        totalImages: data.total,
        totalTime: processEndTime - processStartTimeRef.current,
        averageTimePerImage: (processEndTime - processStartTimeRef.current) / data.total,
        startTime: processStartTimeRef.current,
        endTime: processEndTime
      });
    } else if (data.event === 'heartbeat_ack') {
      console.log('Heartbeat acknowledged by server');
    }
  }, []);

  // WebSocket error handler
  const handleWebSocketError = useCallback((error) => {
    if (batchRunningRef.current) {
      setIsReconnecting(true);
      handlersRef.current.setError('Lost connection to server. Attempting to reconnect...');
    }
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    if (clientId) {
      wsManagerRef.current = new WebSocketManager(
        clientId,
        handleWebSocketMessage,
        handleWebSocketError
      );
      wsManagerRef.current.connect();

      // Heartbeat interval
      const heartbeatInterval = setInterval(() => {
        wsManagerRef.current?.sendHeartbeat();
      }, 30000);

      return () => {
        clearInterval(heartbeatInterval);
        wsManagerRef.current?.disconnect();
      };
    }
  }, [clientId, handleWebSocketMessage, handleWebSocketError]);

  // Start batch processing
  const startBatch = useCallback(async (emailNotification) => {
    try {
      const formData = new FormData();
      if (emailNotification?.trim()) {
        formData.append('email', emailNotification.trim());
      }
      formData.append('client_id', clientId);

      const response = await batchApi.startBatch(formData);
      const newBatchId = response.data.batch_id;
      setBatchId(newBatchId);
      return newBatchId;
    } catch (error) {
      console.error('Error starting batch:', error);
      setError(error.response?.data?.detail || 'Error starting batch process');
      return null;
    }
  }, [clientId, setError]);

  // Initialize batch tracking
  const initializeBatch = useCallback(async (batchId, total) => {
    try {
      await batchApi.initializeBatchTracking(batchId, clientId, total);
      console.log('Batch tracking initialized');
    } catch (error) {
      console.error('Error initializing batch tracking:', error);
      throw error;
    }
  }, [clientId]);

  // Complete batch and get results
  const completeBatch = useCallback(async (batchId) => {
    if (!batchRunning && batchId) {
      try {
        const response = await batchApi.completeBatch(batchId);
        if (response.data?.results && Array.isArray(response.data.results)) {
          const formattedResults = response.data.results.map(result => ({
            isValid: result.Is_Valid === "Valid",
            message: `Logo detection result: ${result.Is_Valid}${result.Error ? ` (${result.Error})` : ''}`,
            name: decodeUrl(result.Image_Path_or_URL)
          }));
          setResults(formattedResults);
        }
        console.log('Processing complete:', response.data);
      } catch (error) {
        console.error('Error completing batch:', error);
      }
    }
  }, [batchRunning, setResults]);

  // Start processing
  const startProcessing = useCallback(() => {
    processStartTimeRef.current = Date.now();
    setBatchRunning(true);
    batchRunningRef.current = true;
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setProgress(null);
    setProcessSummary(null);
    setBatchId(null);
    setBatchRunning(false);
    batchRunningRef.current = false;
    setIsReconnecting(false);
    dispatch({ type: UPLOAD_ACTIONS.RESET_STATE });
  }, []);

  return {
    // State
    progress,
    processSummary,
    batchId,
    batchRunning,
    uploadStatuses: uploadState.uploadStatuses,
    results: uploadState.results,
    error: uploadState.error,
    isReconnecting,
    
    // Actions
    startBatch,
    initializeBatch,
    completeBatch,
    startProcessing,
    resetState,
    setUploadStatuses,
    setError: setError,
    
    // Utilities
    formatTime
  };
};