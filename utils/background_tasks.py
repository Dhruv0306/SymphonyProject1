import asyncio
import logging
from typing import List, Tuple
from services.yolo_client import yolo_client
from utils.batch_tracker import (
    update_batch,
    mark_done,
    clear_batch,
    is_complete_sent,
    mark_complete_sent,
    start_retry_phase,
    update_retry_progress,
)
from utils.websocket import broadcast_json
import csv
import json
import os
import time
import httpx

# Configure logging for this module
logger = logging.getLogger(__name__)


async def process_image_async(
    filename: str,
    file_data: bytes,
    batch_id: str,
    client_id: str,
    csv_path: str,
    failed_requests: list = None,
):
    """
    Process a single image file asynchronously through the YOLO logo detection model.

    Args:
        filename (str): Name of the image file being processed
        file_data (bytes): Raw bytes of the image file
        batch_id (str): Unique identifier for the current batch
        client_id (str): ID of the client to send progress updates to
        csv_path (str): Path to CSV file for storing results

    Returns:
        dict: Detection results containing validation status and metadata
    """
    try:
        # Send image to YOLO model for logo detection
        result = await yolo_client.check_logo(
            file_data=file_data, filename=filename, retries=3
        )
        result["Image_Path_or_URL"] = filename

        # Check if it's a timeout error and collect for retry
        if result.get("Is_Timeout"):
            failed_requests.append(
                {
                    "type": "file",
                    "filename": filename,
                    "file_data": file_data,
                    "error": result.get("Error"),
                }
            )
            return result

        # Write detection results to CSV file
        with open(csv_path, "a", newline="") as csv_file:
            writer = csv.DictWriter(
                csv_file,
                fieldnames=[
                    "Image_Path_or_URL",
                    "Is_Valid",
                    "Confidence",
                    "Detected_By",
                    "Bounding_Box",
                    "Error",
                ],
            )
            writer.writerow(result)

        # Update batch progress metrics
        progress = await update_batch(batch_id, result["Is_Valid"] == "Valid")

        # remove the file from pending files
        from utils.batch_tracker import remove_processed_file

        remove_processed_file(batch_id, filename, result["Is_Valid"] == "Valid")

        # Send progress update to client if client_id provided
        if client_id:
            await broadcast_json(
                client_id,
                {
                    "event": "progress",
                    "batch_id": batch_id,
                    "processed": progress["processed"],
                    "total": progress["total"],
                    "valid": progress["valid"],
                    "invalid": progress["invalid"],
                    "percentage": round(
                        (progress["processed"] / progress["total"]) * 100, 2
                    ),
                    "current_file": filename,
                    "current_status": result["Is_Valid"],
                    "timestamp": time.time(),
                },
            )

        return result

    except Exception as e:
        # Log error and update batch with failed status
        logger.error(f"Error processing {filename}: {e}")
        await update_batch(batch_id, False)
        return {"Image_Path_or_URL": filename, "Is_Valid": "Invalid", "Error": str(e)}


async def process_url_async(
    url: str, batch_id: str, client_id: str, csv_path: str, failed_requests: list = None
):
    """
    Process a single image URL asynchronously through the YOLO logo detection model.

    Args:
        url (str): URL of the image to process
        batch_id (str): Unique identifier for the current batch
        client_id (str): ID of the client to send progress updates to
        csv_path (str): Path to CSV file for storing results

    Returns:
        dict: Detection results containing validation status and metadata
    """
    try:
        # Send image URL to YOLO model for logo detection
        result = await yolo_client.check_logo(image_path=url, retries=3)

        # Check if it's a timeout error and collect for retry
        if result.get("Is_Timeout"):
            print(f"results: {result}")
            failed_requests.append(
                {"type": "url", "url": url, "error": result.get("Error")}
            )
            return result

        # Write detection results to CSV file
        with open(csv_path, "a", newline="") as csv_file:
            writer = csv.DictWriter(
                csv_file,
                fieldnames=[
                    "Image_Path_or_URL",
                    "Is_Valid",
                    "Confidence",
                    "Detected_By",
                    "Bounding_Box",
                    "Error",
                ],
            )
            writer.writerow(result)

        # Update batch progress metrics
        progress = await update_batch(batch_id, result["Is_Valid"] == "Valid")

        # remove the URL from pending URLs
        from utils.batch_tracker import remove_processed_url

        remove_processed_url(batch_id, url, result["Is_Valid"] == "Valid")

        # Send progress update to client if client_id provided
        if client_id:
            await broadcast_json(
                client_id,
                {
                    "event": "progress",
                    "batch_id": batch_id,
                    "processed": progress["processed"],
                    "total": progress["total"],
                    "valid": progress["valid"],
                    "invalid": progress["invalid"],
                    "percentage": round(
                        (progress["processed"] / progress["total"]) * 100, 2
                    ),
                    "current_url": str(url),
                    "current_status": result["Is_Valid"],
                    "timestamp": time.time(),
                },
            )

        return result

    except Exception as e:
        # Log error and update batch with failed status
        logger.error(f"Error processing {url}: {e}")
        await update_batch(batch_id, False)
        return {"Image_Path_or_URL": url, "Is_Valid": "Invalid", "Error": str(e)}


async def process_with_chunks(
    batch_id: str,
    files_data: List[Tuple[str, bytes]] = None,
    image_urls: List[str] = None,
    chunk_size: int = None,
    client_id: str = None,
):
    """
    Process images or URLs in chunks using process_batch_background.

    Args:
        batch_id (str): Unique identifier for this batch
        files_data (List[Tuple[str, bytes]], optional): List of (filename, file_data) tuples
        image_urls (List[str], optional): List of image URLs to process
        chunk_size (int, optional): Number of items per chunk
        client_id (str, optional): ID of client to send progress updates to
    """
    logger.info(f"Starting batch {batch_id} with chunk size {chunk_size}")
    if not chunk_size or chunk_size <= 0:
        chunk_size = 10

    if files_data and image_urls:
        raise ValueError("Provide only one of files_data or image_urls, not both.")

    def chunk_list(lst, size):
        for i in range(0, len(lst), size):
            yield lst[i : i + size]

    # Collect failed requests from all chunks
    failed_requests = []

    # Limit concurrent chunks
    cpu_count = os.cpu_count() or 1
    max_concurrent_chunks = min(max(2, cpu_count // 2), 3)
    semaphore = asyncio.Semaphore(max_concurrent_chunks)

    async def process_chunk_with_limit(chunk_data, is_files=True):
        async with semaphore:
            if is_files:
                return await process_batch_background(
                    batch_id=batch_id,
                    files_data=chunk_data,
                    image_urls=None,
                    client_id=client_id,
                    failed_requests=failed_requests,
                )
            else:
                return await process_batch_background(
                    batch_id=batch_id,
                    files_data=None,
                    image_urls=chunk_data,
                    client_id=client_id,
                    failed_requests=failed_requests,
                )

    # Create tasks for parallel chunk processing
    tasks = []

    if files_data:
        file_chunks = list(chunk_list(files_data, chunk_size))
        tasks = [process_chunk_with_limit(chunk, True) for chunk in file_chunks]
    elif image_urls:
        url_chunks = list(chunk_list(image_urls, chunk_size))
        tasks = [process_chunk_with_limit(chunk, False) for chunk in url_chunks]

    # Process chunks with concurrency limit
    await asyncio.gather(*tasks)

    # Retry failed requests if any
    if failed_requests:
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        csv_path = metadata["csv_path"]
        await retry_failed_requests(failed_requests, batch_id, client_id, csv_path)

    # Check if batch processing is complete
    from utils.batch_tracker import get_progress

    current_progress = get_progress(batch_id)
    retry_complete = not current_progress.get("retry_phase") or current_progress.get(
        "retry_processed", 0
    ) >= current_progress.get("retry_total", 0)

    if (
        current_progress["processed"] >= current_progress["total"]
        and retry_complete
        and not is_complete_sent(batch_id)
    ):
        logger.info(f"Batch completion triggered - sending complete event")
        final_stats = await mark_done(batch_id)

        # Update metadata with final statistics
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")
        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        metadata["counts"]["valid"] = final_stats["valid"]
        metadata["counts"]["invalid"] = final_stats["invalid"]
        metadata["counts"]["total"] = final_stats["total"]
        metadata["status"] = "completed"
        metadata["completed_at"] = time.time()
        email = metadata.get("email")

        with open(metadata_path, "w") as f:
            json.dump(metadata, f)

        # Send completion event to client
        if client_id:
            await broadcast_json(
                client_id,
                {
                    "event": "complete",
                    "batch_id": batch_id,
                    "processed": final_stats["processed"],
                    "total": final_stats["total"],
                    "valid": final_stats["valid"],
                    "invalid": final_stats["invalid"],
                    "percentage": 100,
                    "status": "completed",
                    "timestamp": time.time(),
                },
            )
        clear_batch(batch_id)

        # Clear pending URLs and files for this batch
        from utils.batch_tracker import clear_pending_urls, clear_pending_files

        if image_urls:
            clear_pending_urls(batch_id)
        if files_data:
            clear_pending_files(batch_id)

    # Send email after all chunks complete
    if email:
        try:
            # Use the current request URL to determine the API base URL
            # This ensures it works with any host/port configuration
            from starlette.requests import Request
            from fastapi import Request as FastAPIRequest

            # Get the current request from the context if available
            # Otherwise fall back to environment variable or default
            request = None
            try:
                from fastapi import _request_scope_context_var

                request_scope = _request_scope_context_var.get(None)
                if request_scope is not None:
                    request = Request(request_scope)
            except:
                pass

            if request:
                # Extract base URL from current request
                base_url = str(request.base_url).rstrip("/")
            else:
                # Fall back to environment variable or default
                base_url = os.getenv("API_BASE_URL", "http://localhost:8000")

            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{base_url}/api/check-logo/batch/{batch_id}/send-email"
                )
        except Exception as e:
            logger.error(f"Failed to send email for batch {batch_id}: {e}")


async def process_batch_background(
    batch_id: str,
    files_data: List[Tuple[str, bytes]] = None,
    image_urls: List[str] = None,
    client_id: str = None,
    failed_requests: list = None,
):
    """
    Process a batch of images asynchronously in the background.

    Args:
        batch_id (str): Unique identifier for this batch
        files_data (List[Tuple[str, bytes]], optional): List of (filename, file_data) tuples
        image_urls (List[str], optional): List of image URLs to process
        client_id (str, optional): ID of client to send progress updates to
        failed_requests (list, optional): Shared list to collect failed requests
    """
    try:
        # Load batch metadata to get CSV output path
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")

        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        csv_path = metadata["csv_path"]

        # Limit concurrent requests based on system resources
        cpu_count = os.cpu_count() or 1
        max_concurrent = min(max(2, cpu_count - 2), 4)
        logger.info(
            f"Processing batch {batch_id} with max concurrent requests: {max_concurrent}"
        )
        semaphore = asyncio.Semaphore(max_concurrent)

        async def process_with_limit(task_func, *args):
            async with semaphore:
                return await task_func(*args)

        # Process local image files if provided
        if files_data:
            tasks = [
                process_with_limit(
                    process_image_async,
                    filename,
                    file_data,
                    batch_id,
                    client_id,
                    csv_path,
                    failed_requests,
                )
                for filename, file_data in files_data
            ]
            await asyncio.gather(*tasks)

        # Process image URLs if provided
        if image_urls:
            tasks = [
                process_with_limit(
                    process_url_async,
                    url,
                    batch_id,
                    client_id,
                    csv_path,
                    failed_requests,
                )
                for url in image_urls
            ]
            await asyncio.gather(*tasks)

    except Exception as e:
        # Log error and notify client
        logger.error(f"Background processing error for batch {batch_id}: {e}")
        if client_id:
            await broadcast_json(
                client_id,
                {
                    "event": "error",
                    "batch_id": batch_id,
                    "error": str(e),
                    "timestamp": time.time(),
                },
            )


async def retry_failed_requests(
    failed_requests: list, batch_id: str, client_id: str, csv_path: str
):
    """
    Retry failed timeout requests with different settings.

    Args:
        failed_requests (list): List of failed request details
        batch_id (str): Batch identifier
        client_id (str): Client ID for progress updates
        csv_path (str): Path to CSV file for results
    """
    if not failed_requests:
        return

    logger.info(f"Starting retry phase for {len(failed_requests)} failed requests")
    await start_retry_phase(batch_id, len(failed_requests))

    # Notify client about retry phase
    if client_id:
        await broadcast_json(
            client_id,
            {
                "event": "retry_start",
                "batch_id": batch_id,
                "retry_total": len(failed_requests),
                "timestamp": time.time(),
            },
        )

    # Process failed requests with longer timeout
    for request in failed_requests:
        try:
            if request["type"] == "file":
                result = await process_image_async(
                    filename=request["filename"],
                    file_data=request["file_data"],
                    batch_id=batch_id,
                    client_id=client_id,
                    csv_path=csv_path,
                )
            else:
                result = await process_url_async(
                    url=request["url"],
                    batch_id=batch_id,
                    client_id=client_id,
                    csv_path=csv_path,
                )

            # Write result to CSV
            with open(csv_path, "a", newline="") as csv_file:
                writer = csv.DictWriter(
                    csv_file,
                    fieldnames=[
                        "Image_Path_or_URL",
                        "Is_Valid",
                        "Confidence",
                        "Detected_By",
                        "Bounding_Box",
                        "Error",
                    ],
                )
                writer.writerow(result)

            # Update retry progress
            progress = await update_retry_progress(
                batch_id, result["Is_Valid"] == "Valid"
            )

            # Send retry progress update
            if client_id:
                await broadcast_json(
                    client_id,
                    {
                        "event": "progress",
                        "batch_id": batch_id,
                        "processed": progress["processed"],
                        "total": progress["total"],
                        "valid": progress["valid"],
                        "invalid": progress["invalid"],
                        "percentage": round(
                            (progress["processed"] / progress["total"]) * 100, 2
                        ),
                        "current_item": result["Image_Path_or_URL"],
                        "current_status": result["Is_Valid"],
                        "timestamp": time.time(),
                    },
                )

        except Exception as e:
            logger.error(f"Retry failed for {request}: {e}")
            await update_retry_progress(batch_id, False)

    logger.info(f"Retry phase completed for batch {batch_id}")

    # Check completion status after retry
    from utils.batch_tracker import get_progress

    final_progress = get_progress(batch_id)
    logger.info(
        f"Post-retry progress: processed={final_progress.get('processed')}/{final_progress.get('total')}, retry_processed={final_progress.get('retry_processed')}/{final_progress.get('retry_total')}"
    )
