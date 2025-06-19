from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.ws_manager import connection_manager
import uuid
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connection_manager.connect_client(client_id, websocket)

    try:
        await websocket.send_json({"message": "connected", "client_id": client_id})

        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                if message.get("event") == "heartbeat":
                    logger.debug(f"Heartbeat received from {client_id}")
                    connection_manager.mark_alive(client_id)
                else:
                    logger.info(f"Received from {client_id}: {data}")
                    await websocket.send_text(f"Echo from server: {data}")
            except json.JSONDecodeError:
                logger.info(f"Received non-JSON from {client_id}: {data}")
                await websocket.send_text(f"Echo from server: {data}")

    except WebSocketDisconnect:
        connection_manager.disconnect_client(client_id)
