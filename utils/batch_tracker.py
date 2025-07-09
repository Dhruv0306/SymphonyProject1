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

import os
from typing import Dict, List, Tuple
from collections import defaultdict
import asyncio
import logging
import json

logger = logging.getLogger(__name__)

# Thread-safe shared storage for batch progress tracking
# _batch_data stores the actual progress metrics
# _batch_locks provides per-batch synchronization
_batch_data: Dict[str, Dict] = defaultdict(dict)
_batch_locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

logger.info("Batch tracker initialized with empty state.")


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
    logger.info(f"Initialized batch {batch_id} with total {total} items.")
    # Start auto-expiry task to prevent memory leaks
    asyncio.create_task(auto_expire_batch(batch_id))


def re_init_batch(batch_id: str, total: int, processed: int, valid: int, invalid: int):
    """
    Re-initialize tracking for an existing batch process.

    Args:
        batch_id (str): Unique identifier for the batch
        total (int): Total number of items to be processed

    Resets the progress entry for the batch, allowing it to be reused.
    """
    _batch_data[batch_id] = {
        "processed": processed,
        "total": total,
        "valid": valid,
        "invalid": invalid,
        "done": False,
        "complete_sent": False,
        "retry_phase": False,
        "retry_processed": 0,
        "retry_total": 0,
    }
    logger.info(f"Re-initialized batch {batch_id} with total {total} items.")


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
        logger.info(
            f"Updating batch {batch_id}: processed {progress['processed']}/{progress['total']}"
        )
        if is_valid:
            progress["valid"] += 1
            logger.info(f"Batch {batch_id} valid count updated: {progress['valid']}")
        else:
            progress["invalid"] += 1
            logger.info(
                f"Batch {batch_id} invalid count updated: {progress['invalid']}"
            )
        return dict(progress)


def get_progress(batch_id: str) -> Dict:
    """
    Get current progress state for a batch.

    Args:
        batch_id (str): Batch identifier

    Returns:
        Dict: Current progress state or empty dict if batch not found
    """
    logger.info(f"Fetching progress for batch {batch_id}")
    return _batch_data.get(batch_id, {})


def save_pending_urls(
    batch_id: str, client_id: str, chunk_size: int, image_urls: List[str]
):
    """
    Save pending URLs for a batch.

    Args:
        batch_id (str): Batch identifier
        client_id (str): Client identifier
        chunk_size (int): Size of each chunk
        image_urls (List[str]): List of image URLs to save

    Saves the URLs in a JSON file named with the batch_id.
    """
    pending_path = os.path.join("exports", batch_id, "pending_urls.json")
    data = {
        "batch_id": batch_id,
        "client_id": client_id,
        "chunk_size": chunk_size,
        "image_urls": image_urls,
        "processed": 0,
        "total": len(image_urls),
        "valid": 0,
        "invalid": 0,
        "created_at": asyncio.get_event_loop().time(),
    }
    with open(pending_path, "w") as f:
        json.dump(data, f)
    logger.info(f"Saved pending URLs for batch {batch_id} to {pending_path}")


def save_pending_files(
    batch_id: str, client_id: str, chunk_size: int, files_data: List[Tuple[str, bytes]]
):
    """
    Save pending files for a batch.
    Args:
        batch_id (str): Batch identifier
        client_id (str): Client identifier
        chunk_size (int): Size of each chunk
        files (List[str, bytes]): List of file names and their content
    Saves the files in a JSON file named with the batch_id.
    """
    pending_path = os.path.join("exports", batch_id, "pending_files.json")
    files = [file[0] for file in files_data]  # Extract file names from the tuples
    data = {
        "batch_id": batch_id,
        "client_id": client_id,
        "chunk_size": chunk_size,
        "files_names": files,
        "processed": 0,
        "total": len(files),
        "valid": 0,
        "invalid": 0,
        "created_at": asyncio.get_event_loop().time(),
    }
    with open(pending_path, "w") as f:
        json.dump(data, f)

    # Save images to disk
    pending_files_dir = os.path.join("exports", batch_id, "pending_files")
    os.makedirs(pending_files_dir, exist_ok=True)
    for file_name, file_content in files_data:
        file_path = os.path.join(pending_files_dir, file_name)
        with open(file_path, "wb") as file:
            file.write(file_content)
            logger.debug(f"Saved file {file_name} to {file_path}")
    logger.info(f"Saved pending files for batch {batch_id} to {pending_path}")


def remove_processed_url(batch_id: str, url: str, is_valid: bool):
    """
    Remove a processed URL from the pending list.

    Args:
        batch_id (str): Batch identifier
        url (str): URL to remove

    Updates the JSON file by removing the specified URL.
    """
    pending_path = os.path.join("exports", batch_id, "pending_urls.json")
    if not os.path.exists(pending_path):
        logger.warning(
            f"No pending URLs found for batch {batch_id} to remove URL {url}."
        )
        return

    with open(pending_path, "r") as f:
        data = json.load(f)

    stored_urls = [(str)(u).strip() for u in data.get("image_urls", [])]
    url = (str)(url).strip()
    if url in stored_urls:
        index = stored_urls.index(url)
        real_url = data["image_urls"][index]
        data["image_urls"].remove(real_url)
        data["processed"] += 1
        data["valid" if is_valid else "invalid"] += 1
        with open(pending_path, "w") as f:
            json.dump(data, f)
        logger.info(
            f"Removed URL {url} from pending list for batch {batch_id}. Total processed: {data['processed']}, valid: {data['valid']}, invalid: {data['invalid']}"
        )
    else:
        logger.warning(f"URL {url} not found in pending list for batch {batch_id}.")


def remove_processed_file(batch_id: str, file_name: str, is_valid: bool):
    """
    Remove a processed file from the pending list.

    Args:
        batch_id (str): Batch identifier
        file_name (str): Name of the file to remove

    Updates the JSON file by removing the specified file.
    """
    pending_path = os.path.join("exports", batch_id, "pending_files.json")
    if not os.path.exists(pending_path):
        logger.warning(
            f"No pending files found for batch {batch_id} to remove file {file_name}."
        )
        return

    with open(pending_path, "r") as f:
        data = json.load(f)

    if file_name in data.get("files_names", []):
        data["files_names"].remove(file_name)
        data["processed"] += 1
        data["valid" if is_valid else "invalid"] += 1
        with open(pending_path, "w") as f:
            json.dump(data, f)
        logger.info(
            f"Removed file {file_name} from pending list for batch {batch_id}. Total processed: {data['processed']}, valid: {data['valid']}, invalid: {data['invalid']}"
        )
        # Remove the actual file from disk
        file_path = os.path.join("exports", batch_id, "pending_files", file_name)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed file {file_name} from disk at {file_path}")
    else:
        logger.warning(
            f"File {file_name} not found in pending list for batch {batch_id}."
        )


def clear_pending_urls(batch_id: str):
    """
    Clear pending URLs for a batch.

    Args:
        batch_id (str): Batch identifier

    Deletes the JSON file containing pending URLs for the batch.
    """
    pending_path = os.path.join("exports", batch_id, "pending_urls.json")
    if os.path.exists(pending_path):
        os.remove(pending_path)
        logger.info(f"Cleared pending URLs for batch {batch_id} from {pending_path}")
    else:
        logger.warning(f"No pending URLs found for batch {batch_id} to clear.")


def clear_pending_files(batch_id: str):
    """
    Clear pending files for a batch.

    Args:
        batch_id (str): Batch identifier

    Deletes the JSON file and all files in the pending directory for the batch.
    """
    pending_path = os.path.join("exports", batch_id, "pending_files.json")
    pending_files_dir = os.path.join("exports", batch_id, "pending_files")

    if os.path.exists(pending_path):
        os.remove(pending_path)
        logger.info(
            f"Cleared pending files JSON for batch {batch_id} from {pending_path}"
        )

    if os.path.exists(pending_files_dir):
        for file in os.listdir(pending_files_dir):
            file_path = os.path.join(pending_files_dir, file)
            os.remove(file_path)
            logger.debug(f"Removed file {file} from pending files directory.")
        os.rmdir(pending_files_dir)  # Remove the directory itself
        logger.info(f"Cleared pending files directory for batch {batch_id}.")
    else:
        logger.warning(
            f"No pending files directory found for batch {batch_id} to clear."
        )


async def mark_done(batch_id: str) -> Dict:
    """
    Mark a batch as complete.

    Args:
        batch_id (str): Batch identifier

    Returns:
        Dict: Final progress state

    Sets done and complete_sent flags atomically and returns final state.
    """
    logger.info(f"Marking batch {batch_id} as done.")
    async with _batch_locks[batch_id]:
        progress = _batch_data[batch_id]
        progress["done"] = True
        progress["complete_sent"] = True
        logger.info(f"Batch {batch_id} marked as done with progress: {progress}")
        return dict(progress)


def is_complete_sent(batch_id: str) -> bool:
    """
    Check if completion notification was already sent.

    Args:
        batch_id (str): Batch identifier

    Returns:
        bool: True if complete notification was sent, False otherwise
    """
    logger.info(f"Checking if complete notification sent for batch {batch_id}")
    return _batch_data.get(batch_id, {}).get("complete_sent", False)


async def mark_complete_sent(batch_id: str):
    """
    Mark completion notification as sent.

    Args:
        batch_id (str): Batch identifier

    Thread-safe update of complete_sent flag to prevent duplicate notifications.
    """
    async with _batch_locks[batch_id]:
        logger.info(f"Marking complete notification sent for batch {batch_id}")
        _batch_data[batch_id]["complete_sent"] = True


async def auto_expire_batch(batch_id: str, timeout: int = 21600):
    """
    Auto-expire batch data after timeout period.

    Args:
        batch_id (str): Batch identifier
        timeout (int): Seconds to wait before expiring (default: 6 hour)

    Prevents memory leaks by cleaning up data for abandoned batches.
    Only expires if batch is not marked as done.
    """
    logger.info(
        f"Starting auto-expiry for batch {batch_id} with timeout {timeout} seconds."
    )
    await asyncio.sleep(timeout)
    logger.info(f"Auto-expiry timeout reached for batch {batch_id}. Checking status.")
    if batch_id in _batch_data and not _batch_data[batch_id].get("done", False):
        clear_batch(batch_id)
    logger.info(f"Batch {batch_id} auto-expired and cleared from tracker.")


async def start_retry_phase(batch_id: str, retry_total: int):
    """
    Start the retry phase for failed requests.

    Args:
        batch_id (str): Batch identifier
        retry_total (int): Number of requests to retry
    """
    logger.info(
        f"Starting retry phase for batch {batch_id} with {retry_total} retries."
    )
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
        logger.info(
            f"Updating retry progress for batch {batch_id}: "
            f"retry_processed {progress['retry_processed']}/{progress['retry_total']}, "
            f"processed {progress['processed']}/{progress['total']}"
        )
        if is_valid:
            progress["valid"] += 1
            logger.info(
                f"Batch {batch_id} retry valid count updated: {progress['valid']}"
            )
        else:
            progress["invalid"] += 1
            logger.info(
                f"Batch {batch_id} retry invalid count updated: {progress['invalid']}"
            )
        return dict(progress)


def clear_batch(batch_id: str):
    """
    Remove all tracking data for a batch.

    Args:
        batch_id (str): Batch identifier

    Cleans up both progress data and lock objects.
    """
    logger.info(f"Clearing batch {batch_id} from tracker.")
    _batch_data.pop(batch_id, None)
    _batch_locks.pop(batch_id, None)
    logger.info(f"Batch {batch_id} cleared from tracker state.")
