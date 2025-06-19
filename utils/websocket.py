"""
WebSocket Utility Functions

Provides helper functions for broadcasting messages to WebSocket clients.
"""

from utils.ws_manager import connection_manager
import logging

logger = logging.getLogger(__name__)

async def broadcast_json(client_id: str, data: dict):
    """Send JSON data to a specific client via WebSocket"""
    ws = connection_manager.client_connections.get(client_id)
    if ws:
        try:
            await ws.send_json(data)
        except Exception as e:
            logger.warning(f"WebSocket error for client {client_id}: {e}")