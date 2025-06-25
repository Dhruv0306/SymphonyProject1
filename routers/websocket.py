from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.ws_manager import connection_manager
import uuid
import logging
import json

# Initialize FastAPI router and logger
router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint handler that manages client connections and message processing.

    Args:
        websocket (WebSocket): The WebSocket connection object
        client_id (str): Unique identifier for the client

    The endpoint:
    - Accepts incoming WebSocket connections
    - Manages client connection state
    - Handles heartbeat messages to track client liveness
    - Processes and echoes back client messages
    - Handles client disconnection
    """

    try:
        # Accept the WebSocket connection
        await websocket.accept()

        # Check for connection recovery
        recovered_batches = connection_manager.recover_connection(client_id, websocket)

        # Register the client with the connection manager
        connection_manager.connect_client(client_id, websocket)

        # Send initial connection confirmation to client
        response = {"message": "connected", "client_id": client_id}
        if recovered_batches:
            response["recovered_batches"] = recovered_batches
            response["message"] = "reconnected"
        await websocket.send_json(response)

        # Main message processing loop
        while True:
            # Wait for incoming messages
            data = await websocket.receive_text()

            try:
                # Attempt to parse message as JSON
                message = json.loads(data)

                # Handle heartbeat messages to track client liveness
                if message.get("event") == "heartbeat":
                    logger.debug(f"Heartbeat received from {client_id}")
                    connection_manager.mark_alive(client_id)
                    # Send heartbeat acknowledgment back to client
                    await websocket.send_json({"event": "heartbeat_ack", "timestamp": message.get("timestamp")})
                else:
                    # Log and echo back non-heartbeat messages
                    logger.info(f"Received from {client_id}: {data}")
                    await websocket.send_text(f"Echo from server: {data}")

            except json.JSONDecodeError:
                # Handle non-JSON messages by logging and echoing back
                logger.info(f"Received non-JSON from {client_id}: {data}")
                await websocket.send_text(f"Echo from server: {data}")

    except WebSocketDisconnect:
        # Clean up client connection on disconnect
        logger.info(f"WebSocket disconnected for client {client_id}")
        connection_manager.disconnect_client(client_id)
    except Exception as e:
        # Handle any other connection errors
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        connection_manager.disconnect_client(client_id)
        try:
            await websocket.close()
        except:
            pass
