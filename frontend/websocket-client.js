class WebSocketClient {
    constructor(clientId) {
        this.clientId = clientId || this.generateClientId();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.activeBatches = new Set();
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    generateClientId() {
        return 'client-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    }

    connect() {
        try {
            this.ws = new WebSocket(`ws://localhost:8000/ws/${this.clientId}`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.message === "reconnected" && data.recovered_batches) {
                    console.log('Connection recovered, batches:', data.recovered_batches);
                    data.recovered_batches.forEach(batchId => {
                        this.activeBatches.add(batchId);
                    });
                }
                
                if (data.type === "ping") {
                    this.ws.send(JSON.stringify({type: "pong"}));
                }
                
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

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
    }

    addBatch(batchId) {
        this.activeBatches.add(batchId);
    }

    sendHeartbeat() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({event: "heartbeat"}));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Usage example
const wsClient = new WebSocketClient();

wsClient.onProgress = (data) => {
    console.log(`Batch ${data.batch_id}: ${data.percentage}% complete`);
    // Update UI progress bar
};

wsClient.onComplete = (data) => {
    console.log(`Batch ${data.batch_id} completed`);
    // Show completion message
};

wsClient.onError = (data) => {
    console.error('Batch error:', data.error);
};

// Connect and start heartbeat
wsClient.connect();
setInterval(() => wsClient.sendHeartbeat(), 30000);

// When starting a new batch
function startBatch(batchId) {
    wsClient.addBatch(batchId);
    // Start batch processing...
}