"""
Centralized Batch Progress Tracker

Manages batch processing state to prevent overlapping WebSocket progress streams.
Ensures only one progress stream per batch_id is sent to clients.

The module provides thread-safe tracking of batch processing progress using shared 
dictionaries protected by asyncio locks. It handles initialization, updates, completion
and auto-expiry of batch progress data.

Key features:
- Thread-safe progress tracking with asyncio locks
- Auto-expiry of stale batches to prevent memory leaks  
- Complete event tracking to prevent duplicate notifications
- Centralized state management for WebSocket streams
"""

from typing import Dict
from collections import defaultdict
import asyncio

# Thread-safe shared storage for batch progress tracking
# _batch_data stores the actual progress metrics
# _batch_locks provides per-batch synchronization
_batch_data: Dict[str, Dict] = defaultdict(dict)
_batch_locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)


def init_batch(batch_id: str, total: int):
    """
    Initialize tracking for a new batch process.

    Args:
        batch_id (str): Unique identifier for the batch
        total (int): Total number of items to be processed

    Creates a new progress entry with:
    - processed: Number of items processed (starts at 0)
    - total: Total items in batch
    - valid: Count of valid items
    - invalid: Count of invalid items
    - done: Completion flag
    - complete_sent: Flag to track if complete notification was sent
    """
    _batch_data[batch_id] = {
        "processed": 0,
        "total": total,
        "valid": 0,
        "invalid": 0,
        "done": False,
        "complete_sent": False,
        "retry_phase": False,
        "retry_processed": 0,
        "retry_total": 0,
    }
    # Start auto-expiry task to prevent memory leaks
    asyncio.create_task(auto_expire_batch(batch_id))


async def update_batch(batch_id: str, is_valid: bool) -> Dict:
    """
    Update progress for a batch in a thread-safe manner.

    Args:
        batch_id (str): Batch identifier
        is_valid (bool): Whether the processed item was valid

    Returns:
        Dict: Current progress state for the batch

    Thread-safe update of processed count and valid/invalid tallies.
    Returns a copy of current progress state.
    """
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["processed"] += 1
        if is_valid:
            progress["valid"] += 1
        else:
            progress["invalid"] += 1
        return dict(progress)


def get_progress(batch_id: str) -> Dict:
    """
    Get current progress state for a batch.

    Args:
        batch_id (str): Batch identifier

    Returns:
        Dict: Current progress state or empty dict if batch not found
    """
    return _batch_data.get(batch_id, {})


async def mark_done(batch_id: str) -> Dict:
    """
    Mark a batch as complete.

    Args:
        batch_id (str): Batch identifier

    Returns:
        Dict: Final progress state

    Sets done and complete_sent flags atomically and returns final state.
    """
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["done"] = True
        progress["complete_sent"] = True
        return dict(progress)


def is_complete_sent(batch_id: str) -> bool:
    """
    Check if completion notification was already sent.

    Args:
        batch_id (str): Batch identifier

    Returns:
        bool: True if complete notification was sent, False otherwise
    """
    return _batch_data.get(batch_id, {}).get("complete_sent", False)


async def mark_complete_sent(batch_id: str):
    """
    Mark completion notification as sent.

    Args:
        batch_id (str): Batch identifier

    Thread-safe update of complete_sent flag to prevent duplicate notifications.
    """
    async with _batch_locks[batch_id]:
        _batch_data[batch_id]["complete_sent"] = True


async def auto_expire_batch(batch_id: str, timeout: int = 3600):
    """
    Auto-expire batch data after timeout period.

    Args:
        batch_id (str): Batch identifier
        timeout (int): Seconds to wait before expiring (default: 1 hour)

    Prevents memory leaks by cleaning up data for abandoned batches.
    Only expires if batch is not marked as done.
    """
    await asyncio.sleep(timeout)
    if batch_id in _batch_data and not _batch_data[batch_id].get("done", False):
        clear_batch(batch_id)


async def start_retry_phase(batch_id: str, retry_total: int):
    """
    Start the retry phase for failed requests.

    Args:
        batch_id (str): Batch identifier
        retry_total (int): Number of requests to retry
    """
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["retry_phase"] = True
        progress["retry_total"] = retry_total
        progress["retry_processed"] = 0


async def update_retry_progress(batch_id: str, is_valid: bool) -> Dict:
    """
    Update retry progress for a batch.

    Args:
        batch_id (str): Batch identifier
        is_valid (bool): Whether the retried item was valid

    Returns:
        Dict: Current progress state for the batch
    """
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["retry_processed"] += 1
        progress["processed"] += 1
        if is_valid:
            progress["valid"] += 1
        else:
            progress["invalid"] += 1
        return dict(progress)


def clear_batch(batch_id: str):
    """
    Remove all tracking data for a batch.

    Args:
        batch_id (str): Batch identifier

    Cleans up both progress data and lock objects.
    """
    _batch_data.pop(batch_id, None)
    _batch_locks.pop(batch_id, None)
