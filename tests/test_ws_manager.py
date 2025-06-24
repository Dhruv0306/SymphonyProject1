import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

from utils.ws_manager import (
    ConnectionManager,
    batches,
    timeouts,
    init_batch,
    clear_batch,
    auto_expire_batch,
)


class TestConnectionManager:
    """Test suite for WebSocket connection manager"""

    @pytest.fixture
    def manager(self):
        """Create fresh ConnectionManager instance for each test"""
        return ConnectionManager()

    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket connection"""
        ws = AsyncMock()
        ws.accept = AsyncMock()
        ws.send_text = AsyncMock()
        ws.close = AsyncMock()
        return ws

    @pytest.mark.asyncio
    async def test_connect(self, manager, mock_websocket):
        """Test WebSocket connection establishment"""
        batch_id = "test_batch_123"

        await manager.connect(batch_id, mock_websocket)

        mock_websocket.accept.assert_called_once()
        assert batch_id in manager.active_connections
        assert mock_websocket in manager.active_connections[batch_id]

    def test_disconnect(self, manager, mock_websocket):
        """Test WebSocket disconnection"""
        batch_id = "test_batch_123"
        manager.active_connections[batch_id] = [mock_websocket]

        manager.disconnect(batch_id, mock_websocket)

        assert mock_websocket not in manager.active_connections[batch_id]

    @pytest.mark.asyncio
    async def test_broadcast(self, manager, mock_websocket):
        """Test message broadcasting to WebSocket connections"""
        batch_id = "test_batch_123"
        manager.active_connections[batch_id] = [mock_websocket]
        message = {"type": "progress", "data": {"processed": 5}}

        await manager.broadcast(batch_id, message)

        mock_websocket.send_text.assert_called_once()
        call_args = mock_websocket.send_text.call_args[0][0]
        assert '"type": "progress"' in call_args

    @pytest.mark.asyncio
    async def test_broadcast_connection_error(self, manager, mock_websocket):
        """Test broadcast handling connection errors gracefully"""
        batch_id = "test_batch_123"
        manager.active_connections[batch_id] = [mock_websocket]
        mock_websocket.send_text.side_effect = Exception("Connection lost")

        # Should not raise exception
        await manager.broadcast(batch_id, {"test": "message"})

    def test_connect_client(self, manager, mock_websocket):
        """Test client connection tracking"""
        client_id = "client_123"

        manager.connect_client(client_id, mock_websocket)

        assert client_id in manager.client_connections
        assert manager.client_connections[client_id] == mock_websocket
        assert client_id in manager.client_batch_map

    def test_disconnect_client(self, manager, mock_websocket):
        """Test client disconnection cleanup"""
        client_id = "client_123"
        manager.client_connections[client_id] = mock_websocket
        manager.client_batch_map[client_id] = ["batch_1"]

        manager.disconnect_client(client_id)

        assert client_id not in manager.client_connections
        assert client_id not in manager.client_batch_map

    def test_associate_batch(self, manager):
        """Test batch-client association"""
        client_id = "client_123"
        batch_id = "batch_456"
        manager.client_batch_map[client_id] = []

        manager.associate_batch(client_id, batch_id)

        assert batch_id in manager.client_batch_map[client_id]

    def test_get_client_websocket_by_batch(self, manager, mock_websocket):
        """Test retrieving client WebSocket by batch ID"""
        client_id = "client_123"
        batch_id = "batch_456"
        manager.client_connections[client_id] = mock_websocket
        manager.client_batch_map[client_id] = [batch_id]

        result = manager.get_client_websocket_by_batch(batch_id)

        assert result == mock_websocket

    def test_mark_alive(self, manager):
        """Test client heartbeat tracking"""
        client_id = "client_123"

        manager.mark_alive(client_id)

        assert client_id in manager.client_last_seen
        assert isinstance(manager.client_last_seen[client_id], datetime)

    def test_prune_stale_connections(self, manager, mock_websocket):
        """Test removal of stale connections"""
        client_id = "client_123"
        old_time = datetime.utcnow() - timedelta(seconds=120)

        manager.client_connections[client_id] = mock_websocket
        manager.client_last_seen[client_id] = old_time
        manager.client_batch_map[client_id] = ["batch_1"]

        with patch("utils.ws_manager.asyncio.create_task") as mock_create_task:
            manager.prune_stale_connections(timeout_secs=90)

        assert client_id not in manager.client_connections
        assert client_id in manager.connection_recovery
        mock_create_task.assert_called_once()

    def test_recover_connection(self, manager, mock_websocket):
        """Test connection recovery"""
        client_id = "client_123"
        batches_list = ["batch_1", "batch_2"]
        manager.connection_recovery[client_id] = {
            "batches": batches_list,
            "disconnected_at": datetime.utcnow(),
            "last_seen": datetime.utcnow(),
        }

        recovered_batches = manager.recover_connection(client_id, mock_websocket)

        assert recovered_batches == batches_list
        assert client_id not in manager.connection_recovery


class TestBatchManagement:
    """Test suite for batch management functions"""

    def setup_method(self):
        """Clear global state before each test"""
        batches.clear()
        for task in timeouts.values():
            task.cancel()
        timeouts.clear()

    def test_init_batch(self):
        """Test batch initialization"""
        client_id = "client_123"
        batch_id = "batch_456"
        total = 100

        with patch("utils.ws_manager.asyncio.create_task") as mock_create_task:
            init_batch(client_id, batch_id, total)

        assert batch_id in batches
        assert batches[batch_id]["client_id"] == client_id
        assert batches[batch_id]["total"] == total
        assert batches[batch_id]["processed"] == 0
        assert batch_id in timeouts
        mock_create_task.assert_called_once()

    def test_clear_batch(self):
        """Test batch cleanup"""
        batch_id = "batch_456"
        batches[batch_id] = {"test": "data"}
        mock_task = Mock()
        timeouts[batch_id] = mock_task

        clear_batch(batch_id)

        assert batch_id not in batches
        assert batch_id not in timeouts
        mock_task.cancel.assert_called_once()

    @pytest.mark.asyncio
    async def test_auto_expire_batch(self):
        """Test automatic batch expiration"""
        batch_id = "batch_456"
        batches[batch_id] = {"test": "data"}

        # Use very short timeout for testing
        task = asyncio.create_task(auto_expire_batch(batch_id, timeout=0.1))
        await asyncio.sleep(0.2)

        assert batch_id not in batches
