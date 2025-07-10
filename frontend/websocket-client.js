/**
 * WebSocket Client Module for Real-time Communication
 * 
 * This module implements a robust WebSocket client for maintaining persistent
 * connections to the Symphony Logo Detection backend. It provides real-time
 * updates for batch processing operations with automatic reconnection logic.
 * 
 * Features:
 * - Client identification with unique IDs
 * - Automatic reconnection with exponential backoff
 * - Connection recovery for interrupted batch processes
 * - Heartbeat mechanism to maintain connection health
 * - Event-based architecture for progress, completion, and error handling
 * 
 * @module WebSocketClient
 * @author Symphony AI Team
 * @version 1.0.0
 */

/**
 * Client for managing persistent WebSocket connections.
 * 
 * Provides reliable WebSocket communication with automatic reconnection,
 * batch tracking, and event handling for real-time updates.
 */
class WebSocketClient {
    /**
     * Creates a new WebSocketClient instance.
     * 
     * @param {string} clientId - Unique identifier for this client (auto-generated if not provided)
     */
    constructor(clientId) {
        this.clientId = clientId || this.generateClientId();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.activeBatches = new Set(); // Set of active batch IDs being monitored
        
        // Event handlers for WebSocket events
        this.onProgress = null; // Progress update handler
        this.onComplete = null; // Batch completion handler
        this.onError = null;    // Error handler
    }

    /**
     * Generates a unique client identifier.
     * 
     * Creates a random identifier with timestamp to ensure uniqueness.
     * 
     * @returns {string} Unique client ID
     */
    generateClientId() {
        return 'client-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    }

    /**
     * Establishes WebSocket connection to the server.
     * 
     * Sets up event handlers for the WebSocket connection and
     * handles reconnection if the connection is lost.
     */
    connect() {
        try {
            this.ws = new WebSocket(`ws://localhost:8000/ws/${this.clientId}`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                // Handle connection recovery with batch state restoration
                if (data.message === "reconnected" && data.recovered_batches) {
                    console.log('Connection recovered, batches:', data.recovered_batches);
                    data.recovered_batches.forEach(batchId => {
                        this.activeBatches.add(batchId);
                    });
                }
                
                // Handle ping messages for connection maintenance
                if (data.type === "ping") {
                    this.ws.send(JSON.stringify({type: "pong"}));
                }
                
                // Forward events to appropriate handlers
                if (data.event === "progress" && this.onProgress) {
                    this.onProgress(data);
                }
                
                if (data.event === "complete" && this.onComplete) {
                    this.activeBatches.delete(data.batch_id);
                    this.onComplete(data);
                }
                
                if (data.event === "error" && this.onError) {
                    this.onError(data);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.reconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to connect:', error);
            this.reconnect();
        }
    }

    /**
     * Attempts to reconnect to the WebSocket server.
     * 
     * Implements exponential backoff to avoid overwhelming the server
     * during outages or connectivity issues.
     */
    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
    }

    /**
     * Registers a batch for monitoring.
     * 
     * Adds the batch ID to the set of active batches being monitored,
     * allowing the server to restore monitoring if the connection is lost.
     * 
     * @param {string} batchId - Unique identifier for the batch process
     */
    addBatch(batchId) {
        this.activeBatches.add(batchId);
    }

    /**
     * Sends a heartbeat message to keep the connection alive.
     * 
     * Used to prevent connection timeout during periods of inactivity.
     */
    sendHeartbeat() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({event: "heartbeat"}));
        }
    }

    /**
     * Closes the WebSocket connection.
     * 
     * Used for cleanup during application shutdown or page navigation.
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Create a singleton instance for application-wide use
const wsClient = new WebSocketClient();

/**
 * Progress update handler.
 * 
 * @param {Object} data - Progress data from the server
 * @param {string} data.batch_id - Identifier of the batch process
 * @param {number} data.percentage - Completion percentage (0-100)
 */
wsClient.onProgress = (data) => {
    console.log(`Batch ${data.batch_id}: ${data.percentage}% complete`);
    // Update UI progress bar
};

/**
 * Batch completion handler.
 * 
 * @param {Object} data - Completion data from the server
 * @param {string} data.batch_id - Identifier of the completed batch process
 */
wsClient.onComplete = (data) => {
    console.log(`Batch ${data.batch_id} completed`);
    // Show completion message
};

/**
 * Error handler for WebSocket events.
 * 
 * @param {Object} data - Error data from the server
 * @param {string} data.error - Error message
 */
wsClient.onError = (data) => {
    console.error('Batch error:', data.error);
};

// Connect and start heartbeat mechanism
wsClient.connect();
setInterval(() => wsClient.sendHeartbeat(), 30000); // Send heartbeat every 30 seconds

/**
 * Registers a batch for WebSocket monitoring.
 * 
 * @param {string} batchId - Unique identifier for the batch process
 */
function startBatch(batchId) {
    wsClient.addBatch(batchId);
    // Start batch processing...
}