"""
WebSocket Utility Functions

Provides helper functions for broadcasting messages to WebSocket clients via WebSocket connections.
Handles client-specific message broadcasting with error handling and logging.

Functions:
    broadcast_json: Sends JSON data to a specific WebSocket client

Dependencies:
    - utils.ws_manager: For managing WebSocket connections
    - logging: For error logging and debugging
"""

from utils.ws_manager import connection_manager
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)


async def broadcast_json(client_id: str, data: dict):
    """
    Send JSON data to a specific client via WebSocket connection.

    Args:
        client_id (str): Unique identifier for the target WebSocket client
        data (dict): JSON-serializable dictionary to send to the client

    Returns:
        None

    Raises:
        No exceptions are raised - errors are logged and handled gracefully
    """
    # Get WebSocket connection for the specified client
    ws = connection_manager.client_connections.get(client_id)

    if ws:
        try:
            # Attempt to send JSON data to the client
            await ws.send_json(data)
        except Exception as e:
            # Log any errors that occur during sending
            logger.warning(f"WebSocket error for client {client_id}: {e}")
