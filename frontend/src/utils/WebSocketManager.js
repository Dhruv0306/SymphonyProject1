/**
 * WebSocket Connection Manager Module
 * 
 * Provides a robust WebSocket connection management system with automatic reconnection,
 * exponential backoff, heartbeat functionality, and error handling. This module
 * abstracts the complexity of managing WebSocket connections for real-time
 * communication with the Symphony Logo Detection backend.
 * 
 * Features:
 * - Automatic reconnection with exponential backoff strategy
 * - Client identification for session tracking
 * - Connection state monitoring
 * - Heartbeat mechanism for connection health checks
 * 
 * @module WebSocketManager
 * @author Symphony AI Team
 * @version 1.1.0
 */

import { WS_BASE_URL } from '../config';

/**
 * WebSocket connection manager with automatic reconnection capabilities.
 * 
 * Maintains a persistent WebSocket connection to the server and automatically
 * reconnects with exponential backoff when the connection is lost.
 */
export class WebSocketManager {
  /**
   * Creates a new WebSocketManager instance.
   * 
   * @param {string} clientId - Unique identifier for this client
   * @param {Function} onMessage - Callback function for processing WebSocket messages
   * @param {Function} onError - Callback function for handling WebSocket errors
   */
  constructor(clientId, onMessage, onError) {
    this.clientId = clientId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isReconnecting = false;
  }

  /**
   * Establishes a WebSocket connection to the server.
   * 
   * Sets up event handlers for the connection and prepares for
   * automatic reconnection if the connection is lost.
   */
  connect() {
    if (this.ws) return; // Avoid creating duplicate connections

    const wsUrl = `${WS_BASE_URL}/ws/${this.clientId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isReconnecting = false;
      this.reconnectAttempts = 0; // Reset reconnection counter on successful connection
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data); // Forward messages to callback handler
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.shouldReconnect()) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError(error); // Forward errors to callback handler
    };
  }

  /**
   * Determines whether reconnection should be attempted.
   * 
   * @returns {boolean} True if reconnection attempts have not exceeded maximum
   */
  shouldReconnect() {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }

  /**
   * Attempts to reconnect to the WebSocket server.
   * 
   * Implements exponential backoff to avoid overwhelming the server
   * during outages or connectivity issues.
   */
  attemptReconnect() {
    if (this.isReconnecting) return; // Prevent multiple simultaneous reconnection attempts
    
    this.isReconnecting = true;
    this.reconnectAttempts += 1;
    
    // Calculate exponential backoff delay with 1s, 2s, 4s, 8s, 16s pattern
    // Capped at 16 seconds maximum delay
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);
    
    setTimeout(() => {
      console.log(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  /**
   * Sends a heartbeat message to keep the connection alive.
   * 
   * Used to prevent connection timeout during periods of inactivity
   * and to detect connection issues early.
   */
  sendHeartbeat() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: "heartbeat",
        client_id: this.clientId,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Closes the WebSocket connection.
   * 
   * Used for cleanup during application shutdown or page navigation.
   */
  disconnect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
  }

  /**
   * Checks if the WebSocket connection is currently open.
   * 
   * @returns {boolean} True if the connection is established and open
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}