"""
WebSocket Connection Manager for Real-time Batch Processing Updates

This module provides a WebSocket connection manager to handle real-time
updates for batch image processing jobs.
"""

from fastapi import WebSocket
from typing import Dict, List, Any
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time batch processing updates.

    Attributes:
        active_connections: Dictionary mapping batch IDs to lists of active WebSocket connections
    """

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

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


# Create a singleton instance of the connection manager
connection_manager = ConnectionManager()
