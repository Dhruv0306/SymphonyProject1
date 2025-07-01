"""
WebSocket Connection Manager for Real-time Batch Processing Updates

This module provides a WebSocket connection manager to handle real-time
updates for batch image processing jobs. It manages WebSocket connections,
client tracking, batch associations and timeouts.

The ConnectionManager class handles:
- WebSocket connection management per batch
- Client connection tracking and heartbeats 
- Batch-client associations
- Broadcasting messages to connected clients
- Pruning stale connections
"""

from fastapi import WebSocket
from typing import Dict, List, Any
import json
import logging
import asyncio
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Global storage for batch data and timeout tasks
batches = {}  # Stores batch processing state and results
timeouts = {}  # Stores timeout tasks for auto-expiring batches


class ConnectionManager:
    """
    Manages WebSocket connections for real-time batch processing updates.

    This class handles all WebSocket connection management including:
    - Accepting and storing new connections
    - Tracking client-batch associations
    - Broadcasting messages to connected clients
    - Managing client heartbeats and connection timeouts

    Attributes:
        active_connections: Dictionary mapping batch IDs to lists of active WebSocket connections
        client_connections: Dictionary mapping client IDs to WebSocket connections
        client_batch_map: Dictionary mapping client IDs to lists of batch IDs
        client_last_seen: Dictionary tracking last heartbeat timestamp from each client
    """

    def __init__(self):
        """Initialize empty connection tracking dictionaries"""
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.client_connections: Dict[str, WebSocket] = {}
        self.client_batch_map: Dict[str, List[str]] = {}
        self.client_last_seen: Dict[str, datetime] = {}
        self.connection_recovery: Dict[str, dict] = {}  # Track recovery info

    async def connect(self, batch_id: str, websocket: WebSocket):
        """
        Accept a WebSocket connection and store it for a specific batch ID.

        Creates a new connection list for the batch if it doesn't exist.
        Logs connection info for monitoring purposes.

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
        Remove a WebSocket connection for a specific batch ID.

        Safely removes connection if it exists and logs the disconnection.

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
        Broadcast a message to all WebSocket connections for a specific batch ID.

        Converts message to JSON and sends to all connections for the batch.
        Handles send errors gracefully and logs debug info.

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
        """
        Store client WebSocket connection and initialize batch mapping.

        Args:
            client_id: Unique identifier for the client
            websocket: The WebSocket connection to store
        """
        self.client_connections[client_id] = websocket
        self.client_batch_map.setdefault(client_id, [])
        logger.info(f"Client {client_id} connected")

    def disconnect_client(self, client_id: str):
        """
        Remove client WebSocket connection and clean up mappings.

        Args:
            client_id: Unique identifier for the client to disconnect
        """
        self.client_connections.pop(client_id, None)
        self.client_batch_map.pop(client_id, None)
        logger.info(f"Client {client_id} disconnected")

    def associate_batch(self, client_id: str, batch_id: str):
        """
        Associate a batch with a client for tracking purposes.

        Args:
            client_id: Unique identifier for the client
            batch_id: The ID of the batch to associate
        """
        if client_id in self.client_batch_map:
            self.client_batch_map[client_id].append(batch_id)
            logger.info(f"Associated batch {batch_id} with client {client_id}")

    def get_client_websocket_by_batch(self, batch_id: str) -> WebSocket:
        """
        Get client WebSocket connection by looking up batch ID.

        Args:
            batch_id: The ID of the batch to look up

        Returns:
            WebSocket connection if found, None otherwise
        """
        for client_id, batches in self.client_batch_map.items():
            if batch_id in batches:
                return self.client_connections.get(client_id)
        return None

    def mark_alive(self, client_id: str):
        """
        Mark client as alive by updating last seen timestamp.

        Args:
            client_id: Unique identifier for the client
        """
        self.client_last_seen[client_id] = datetime.now(timezone.utc)
        logger.debug(
            f"Client {client_id} marked alive at {self.client_last_seen[client_id]}"
        )

    def prune_stale_connections(self, timeout_secs=90):
        """
        Remove inactive WebSocket connections based on timeout.
        """
        now = datetime.now(timezone.utc)
        stale_clients = []

        for client_id, last_seen in self.client_last_seen.items():
            if (now - last_seen).total_seconds() > timeout_secs:
                stale_clients.append(client_id)

        for client_id in stale_clients:
            # Store recovery info before cleanup
            if client_id in self.client_batch_map:
                self.connection_recovery[client_id] = {
                    "batches": self.client_batch_map[client_id].copy(),
                    "disconnected_at": now,
                    "last_seen": self.client_last_seen.get(client_id),
                }

            ws = self.client_connections.pop(client_id, None)
            self.client_last_seen.pop(client_id, None)
            self.client_batch_map.pop(client_id, None)
            if ws:
                asyncio.create_task(ws.close())
                logger.info(f"Pruned stale WebSocket for client {client_id}")

    def recover_connection(self, client_id: str, websocket: WebSocket) -> List[str]:
        """
        Recover connection and return associated batch IDs.
        """
        recovery_info = self.connection_recovery.pop(client_id, None)
        if recovery_info:
            logger.info(
                f"Recovering connection for client {client_id} with batches: {recovery_info['batches']}"
            )
            self.connect_client(client_id, websocket)
            self.client_batch_map[client_id] = recovery_info["batches"]
            return recovery_info["batches"]
        return []

    def cleanup_recovery_info(self, max_age_hours=24):
        """
        Clean up old recovery information.
        """
        now = datetime.now(timezone.utc)
        expired = []
        for client_id, info in self.connection_recovery.items():
            if (now - info["disconnected_at"]).total_seconds() > max_age_hours * 3600:
                expired.append(client_id)

        for client_id in expired:
            self.connection_recovery.pop(client_id, None)


async def auto_expire_batch(batch_id, timeout=1800):
    """
    Auto-expire batch after timeout period.

    Args:
        batch_id: The ID of the batch to expire
        timeout: Time in seconds before batch expires
    """
    await asyncio.sleep(timeout)
    if batch_id in batches:
        print(f"Batch {batch_id} expired due to inactivity")
        clear_batch(batch_id)


def init_batch(client_id, batch_id, total):
    """
    Initialize a new batch with timeout.

    Creates batch record and starts expiration timer.

    Args:
        client_id: ID of client creating the batch
        batch_id: Unique identifier for the batch
        total: Total number of items in batch
    """
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
    """
    Clear batch and cancel its timeout.

    Args:
        batch_id: The ID of the batch to clear
    """
    batches.pop(batch_id, None)
    if batch_id in timeouts:
        timeouts[batch_id].cancel()
        del timeouts[batch_id]


# Create singleton instance for global connection management
connection_manager = ConnectionManager()
