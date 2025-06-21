import asyncio
import logging
from typing import List, Tuple
from services.yolo_client import yolo_client
from utils.batch_tracker import update_batch, mark_done, clear_batch, is_complete_sent, mark_complete_sent
from utils.websocket import broadcast_json
import csv
import json
import os
import time

logger = logging.getLogger(__name__)

async def process_image_async(filename: str, file_data: bytes, batch_id: str, client_id: str, csv_path: str):
    """Process single image asynchronously"""
    try:
        result = await yolo_client.check_logo(file_data=file_data, filename=filename)
        result["Image_Path_or_URL"] = filename
        
        # Write to CSV
        with open(csv_path, "a", newline="") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=[
                "Image_Path_or_URL", "Is_Valid", "Confidence", 
                "Detected_By", "Bounding_Box", "Error"
            ])
            writer.writerow(result)
        
        # Update progress
        progress = await update_batch(batch_id, result["Is_Valid"] == "Valid")
        
        # Send progress update
        if client_id:
            await broadcast_json(client_id, {
                "event": "progress",
                "batch_id": batch_id,
                "processed": progress["processed"],
                "total": progress["total"],
                "valid": progress["valid"],
                "invalid": progress["invalid"],
                "percentage": round((progress["processed"] / progress["total"]) * 100, 2),
                "current_file": filename,
                "current_status": result["Is_Valid"],
                "timestamp": time.time()
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing {filename}: {e}")
        await update_batch(batch_id, False)
        return {"Image_Path_or_URL": filename, "Is_Valid": "Invalid", "Error": str(e)}

async def process_url_async(url: str, batch_id: str, client_id: str, csv_path: str):
    """Process single URL asynchronously"""
    try:
        result = await yolo_client.check_logo(image_path=url)
        
        # Write to CSV
        with open(csv_path, "a", newline="") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=[
                "Image_Path_or_URL", "Is_Valid", "Confidence", 
                "Detected_By", "Bounding_Box", "Error"
            ])
            writer.writerow(result)
        
        # Update progress
        progress = await update_batch(batch_id, result["Is_Valid"] == "Valid")
        
        # Send progress update
        if client_id:
            await broadcast_json(client_id, {
                "event": "progress",
                "batch_id": batch_id,
                "processed": progress["processed"],
                "total": progress["total"],
                "valid": progress["valid"],
                "invalid": progress["invalid"],
                "percentage": round((progress["processed"] / progress["total"]) * 100, 2),
                "current_url": str(url),
                "current_status": result["Is_Valid"],
                "timestamp": time.time()
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing {url}: {e}")
        await update_batch(batch_id, False)
        return {"Image_Path_or_URL": url, "Is_Valid": "Invalid", "Error": str(e)}

async def process_batch_background(batch_id: str, files_data: List[Tuple[str, bytes]] = None, 
                                 image_urls: List[str] = None, client_id: str = None):
    """Process entire batch in background"""
    try:
        # Get CSV path from metadata
        batch_dir = os.path.join("exports", batch_id)
        metadata_path = os.path.join(batch_dir, "metadata.json")
        
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        csv_path = metadata["csv_path"]
        
        # Process files
        if files_data:
            tasks = [
                process_image_async(filename, file_data, batch_id, client_id, csv_path)
                for filename, file_data in files_data
            ]
            await asyncio.gather(*tasks)
        
        # Process URLs
        if image_urls:
            tasks = [
                process_url_async(url, batch_id, client_id, csv_path)
                for url in image_urls
            ]
            await asyncio.gather(*tasks)
        
        # Check if batch is complete and send final event only once
        from utils.batch_tracker import get_progress
        current_progress = get_progress(batch_id)
        
        if (current_progress["processed"] >= current_progress["total"] and 
            not is_complete_sent(batch_id)):
            
            final_stats = await mark_done(batch_id)
            
            # Update metadata.json with final counts and completion time
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
            
            metadata["counts"]["valid"] = final_stats["valid"]
            metadata["counts"]["invalid"] = final_stats["invalid"]
            metadata["counts"]["total"] = final_stats["total"]
            metadata["status"] = "completed"
            metadata["completed_at"] = time.time()
            
            with open(metadata_path, "w") as f:
                json.dump(metadata, f)
            
            if client_id:
                await broadcast_json(client_id, {
                    "event": "complete",
                    "batch_id": batch_id,
                    "processed": final_stats["processed"],
                    "total": final_stats["total"],
                    "valid": final_stats["valid"],
                    "invalid": final_stats["invalid"],
                    "percentage": 100,
                    "status": "completed",
                    "timestamp": time.time()
                })
            
            clear_batch(batch_id)
        
    except Exception as e:
        logger.error(f"Background processing error for batch {batch_id}: {e}")
        if client_id:
            await broadcast_json(client_id, {
                "event": "error",
                "batch_id": batch_id,
                "error": str(e),
                "timestamp": time.time()
            })