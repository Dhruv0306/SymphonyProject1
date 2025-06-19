"""
WebSocket Connection Manager for Real-time Batch Processing Updates

This module provides a WebSocket connection manager to handle real-time
updates for batch image processing jobs.
"""

from fastapi import WebSocket
from typing import Dict, List, Any
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

# Global batch storage and timeout management
batches = {}
timeouts = {}


class ConnectionManager:
    """
    Manages WebSocket connections for real-time batch processing updates.

    Attributes:
        active_connections: Dictionary mapping batch IDs to lists of active WebSocket connections
        client_connections: Dictionary mapping client IDs to WebSocket connections
        client_batch_map: Dictionary mapping client IDs to lists of batch IDs
    """

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.client_connections: Dict[str, WebSocket] = {}
        self.client_batch_map: Dict[str, List[str]] = {}

    async def connect(self, batch_id: str, websocket: WebSocket):
        """
        Accept a WebSocket connection and store it for a specific batch ID

        Args:
            batch_id: The ID of the batch to associate with this connection
            websocket: The WebSocket connection to store
        """
        await websocket.accept()
        if batch_id not in self.active_connections:
            self.active_connections[batch_id] = []
        self.active_connections[batch_id].append(websocket)
        logger.info(
            f"New WebSocket connection for batch {batch_id}. Total connections: {len(self.active_connections[batch_id])}"
        )

    def disconnect(self, batch_id: str, websocket: WebSocket):
        """
        Remove a WebSocket connection for a specific batch ID

        Args:
            batch_id: The ID of the batch associated with the connection
            websocket: The WebSocket connection to remove
        """
        if batch_id in self.active_connections:
            if websocket in self.active_connections[batch_id]:
                self.active_connections[batch_id].remove(websocket)
                logger.info(
                    f"WebSocket disconnected from batch {batch_id}. Remaining connections: {len(self.active_connections[batch_id])}"
                )

    async def broadcast(self, batch_id: str, message: Any):
        """
        Broadcast a message to all WebSocket connections for a specific batch ID

        Args:
            batch_id: The ID of the batch to broadcast to
            message: The message to broadcast (will be converted to JSON)
        """
        if batch_id in self.active_connections:
            message_json = json.dumps(message)
            for connection in self.active_connections[batch_id]:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message: {str(e)}")

            logger.debug(
                f"Broadcast message to {len(self.active_connections[batch_id])} connections for batch {batch_id}"
            )

    def connect_client(self, client_id: str, websocket: WebSocket):
        """Store client WebSocket connection"""
        self.client_connections[client_id] = websocket
        self.client_batch_map.setdefault(client_id, [])
        logger.info(f"Client {client_id} connected")

    def disconnect_client(self, client_id: str):
        """Remove client WebSocket connection"""
        self.client_connections.pop(client_id, None)
        self.client_batch_map.pop(client_id, None)
        logger.info(f"Client {client_id} disconnected")

    def associate_batch(self, client_id: str, batch_id: str):
        """Associate a batch with a client"""
        if client_id in self.client_batch_map:
            self.client_batch_map[client_id].append(batch_id)
            logger.info(f"Associated batch {batch_id} with client {client_id}")

    def get_client_websocket_by_batch(self, batch_id: str) -> WebSocket:
        """Get client WebSocket by batch ID"""
        for client_id, batches in self.client_batch_map.items():
            if batch_id in batches:
                return self.client_connections.get(client_id)
        return None


async def auto_expire_batch(batch_id, timeout=1800):
    """Auto-expire batch after timeout period"""
    await asyncio.sleep(timeout)
    if batch_id in batches:
        print(f"Batch {batch_id} expired due to inactivity")
        clear_batch(batch_id)


def init_batch(client_id, batch_id, total):
    """Initialize a new batch with timeout"""
    batches[batch_id] = {
        "client_id": client_id,
        "processed": 0,
        "valid": 0,
        "invalid": 0,
        "total": total,
        "results": [],
    }
    timeouts[batch_id] = asyncio.create_task(auto_expire_batch(batch_id))


def clear_batch(batch_id):
    """Clear batch and cancel its timeout"""
    batches.pop(batch_id, None)
    if batch_id in timeouts:
        timeouts[batch_id].cancel()
        del timeouts[batch_id]


# Create a singleton instance of the connection manager
connection_manager = ConnectionManager()
