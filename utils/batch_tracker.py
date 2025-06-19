"""
Centralized Batch Progress Tracker

Manages batch processing state to prevent overlapping WebSocket progress streams.
Ensures only one progress stream per batch_id is sent to clients.
"""

from typing import Dict
from collections import defaultdict
import asyncio

# Thread-safe shared storage for batch progress
_batch_data: Dict[str, Dict] = defaultdict(dict)
_batch_locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

def init_batch(batch_id: str, total: int):
    """Initialize batch tracking with total count"""
    _batch_data[batch_id] = {
        "processed": 0,
        "total": total,
        "valid": 0,
        "invalid": 0,
        "done": False
    }
    asyncio.create_task(auto_expire_batch(batch_id))

async def update_batch(batch_id: str, is_valid: bool) -> Dict:
    """Update batch progress and return current state"""
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["processed"] += 1
        if is_valid:
            progress["valid"] += 1
        else:
            progress["invalid"] += 1
        return dict(progress)

def get_progress(batch_id: str) -> Dict:
    """Get current batch progress"""
    return _batch_data.get(batch_id, {})

async def mark_done(batch_id: str) -> Dict:
    """Mark batch as complete and return final state"""
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["done"] = True
        return dict(progress)

async def auto_expire_batch(batch_id: str, timeout: int = 3600):
    """Auto-expire batch after timeout to prevent memory leaks"""
    await asyncio.sleep(timeout)
    if batch_id in _batch_data and not _batch_data[batch_id].get("done", False):
        clear_batch(batch_id)

def clear_batch(batch_id: str):
    """Clean up batch tracking data"""
    _batch_data.pop(batch_id, None)
    _batch_locks.pop(batch_id, None)