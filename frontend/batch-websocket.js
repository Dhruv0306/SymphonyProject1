class BatchWebSocketClient {
    constructor(baseUrl = 'ws://localhost:8000') {
        this.baseUrl = baseUrl;
        this.batchConnections = new Map();
    }

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
                
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({type: 'pong'}));
                    return;
                }
                
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

    reconnectToBatch(connection) {
        if (connection.reconnectAttempts < connection.maxReconnectAttempts) {
            connection.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting to batch ${connection.batchId}...`);
                this.batchConnections.delete(connection.batchId);
                this.connectToBatch(connection.batchId);
            }, 1000 * connection.reconnectAttempts);
        }
    }

    handleBatchUpdate(batchId, data) {
        // Override this method to handle batch updates
        console.log(`Batch ${batchId} update:`, data);
    }

    disconnectFromBatch(batchId) {
        const connection = this.batchConnections.get(batchId);
        if (connection) {
            connection.ws.close();
            this.batchConnections.delete(batchId);
        }
    }

    disconnectAll() {
        this.batchConnections.forEach((connection, batchId) => {
            connection.ws.close();
        });
        this.batchConnections.clear();
    }
}

// Usage example
const batchClient = new BatchWebSocketClient();

// Override the update handler
batchClient.handleBatchUpdate = (batchId, data) => {
    console.log(`Batch ${batchId}: ${JSON.stringify(data)}`);
    // Update your UI here
};

// Connect to a batch
function monitorBatch(batchId) {
    batchClient.connectToBatch(batchId);
}

// Disconnect from a batch
function stopMonitoring(batchId) {
    batchClient.disconnectFromBatch(batchId);
}