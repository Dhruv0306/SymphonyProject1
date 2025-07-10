/**
 * Batch WebSocket Client Module
 * 
 * This module provides a WebSocket client specifically designed for monitoring batch processing operations.
 * It manages connections to individual batch processing WebSocket endpoints, handles automatic reconnection,
 * and provides an event-driven interface for processing real-time batch progress updates.
 * 
 * Features:
 * - Automatic connection management for multiple batch processes
 * - Reconnection logic with exponential backoff
 * - Heartbeat/ping-pong support for connection maintenance
 * - Event-driven architecture for processing batch updates
 * 
 * @module BatchWebSocketClient
 * @author Symphony AI Team
 * @version 1.0.0
 */

/**
 * Client for managing batch processing WebSocket connections.
 * 
 * Maintains a map of active WebSocket connections to batch processing endpoints
 * and handles reconnection, message parsing, and event dispatching.
 */
class BatchWebSocketClient {
    /**
     * Creates a new BatchWebSocketClient instance.
     * 
     * @param {string} baseUrl - Base URL for WebSocket connections (defaults to localhost)
     */
    constructor(baseUrl = 'ws://localhost:8000') {
        this.baseUrl = baseUrl;
        this.batchConnections = new Map(); // Map of batchId -> connection objects
    }

    /**
     * Establishes a WebSocket connection to a specific batch process.
     * 
     * If a connection to the specified batch already exists, returns the existing connection.
     * Otherwise, creates a new connection, sets up event handlers, and adds it to the connection map.
     * 
     * @param {string} batchId - Unique identifier for the batch process
     * @returns {Object} Connection object containing WebSocket and metadata
     */
    connectToBatch(batchId) {
        if (this.batchConnections.has(batchId)) {
            return this.batchConnections.get(batchId);
        }

        const ws = new WebSocket(`${this.baseUrl}/ws/batch/${batchId}`);
        const connection = {
            ws: ws,
            batchId: batchId,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5
        };

        ws.onopen = () => {
            console.log(`Connected to batch ${batchId}`);
            connection.reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle ping messages for connection maintenance
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({type: 'pong'}));
                    return;
                }
                
                // Process batch update messages
                this.handleBatchUpdate(batchId, data);
            } catch (e) {
                console.log(`Batch ${batchId} message:`, event.data);
            }
        };

        ws.onclose = () => {
            console.log(`Disconnected from batch ${batchId}`);
            this.reconnectToBatch(connection);
        };

        ws.onerror = (error) => {
            console.error(`Batch ${batchId} WebSocket error:`, error);
        };

        this.batchConnections.set(batchId, connection);
        return connection;
    }

    /**
     * Attempts to reconnect to a batch process after connection loss.
     * 
     * Implements exponential backoff for reconnection attempts to avoid
     * overwhelming the server during outages.
     * 
     * @param {Object} connection - Connection object containing WebSocket and metadata
     */
    reconnectToBatch(connection) {
        if (connection.reconnectAttempts < connection.maxReconnectAttempts) {
            connection.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting to batch ${connection.batchId}...`);
                this.batchConnections.delete(connection.batchId);
                this.connectToBatch(connection.batchId);
            }, 1000 * connection.reconnectAttempts); // Exponential backoff
        }
    }

    /**
     * Processes batch update messages received via WebSocket.
     * 
     * This is a placeholder method designed to be overridden by consumers
     * to implement custom batch update handling logic.
     * 
     * @param {string} batchId - Identifier of the batch that was updated
     * @param {Object} data - Update data received from the WebSocket
     */
    handleBatchUpdate(batchId, data) {
        // Override this method to handle batch updates
        console.log(`Batch ${batchId} update:`, data);
    }

    /**
     * Closes WebSocket connection to a specific batch process.
     * 
     * @param {string} batchId - Identifier of the batch to disconnect from
     */
    disconnectFromBatch(batchId) {
        const connection = this.batchConnections.get(batchId);
        if (connection) {
            connection.ws.close();
            this.batchConnections.delete(batchId);
        }
    }

    /**
     * Closes all active batch WebSocket connections.
     * 
     * Useful for cleanup during application shutdown or page navigation.
     */
    disconnectAll() {
        this.batchConnections.forEach((connection, batchId) => {
            connection.ws.close();
        });
        this.batchConnections.clear();
    }
}

// Usage example
const batchClient = new BatchWebSocketClient();

/**
 * Override the update handler to process batch updates.
 * 
 * @param {string} batchId - Identifier of the batch that was updated
 * @param {Object} data - Update data received from the WebSocket
 */
batchClient.handleBatchUpdate = (batchId, data) => {
    console.log(`Batch ${batchId}: ${JSON.stringify(data)}`);
    // Update your UI here
};

/**
 * Begin monitoring a batch process for updates.
 * 
 * @param {string} batchId - Identifier of the batch to monitor
 */
function monitorBatch(batchId) {
    batchClient.connectToBatch(batchId);
}

/**
 * Stop monitoring a batch process.
 * 
 * @param {string} batchId - Identifier of the batch to stop monitoring
 */
function stopMonitoring(batchId) {
    batchClient.disconnectFromBatch(batchId);
}