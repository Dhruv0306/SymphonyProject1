from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.requests import Request
from typing import List, Optional
from models.logo_check import LogoCheckResult
from utils.file_ops import process_single_path, UPLOAD_DIR
from slowapi import Limiter
from slowapi.util import get_remote_address
from tqdm import tqdm
import os
import shutil
import uuid
import tempfile
import csv
import logging
import json

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/api",
    tags=["Batch Processing"]
)

@router.post("/start-batch")
async def start_batch(request: Request):
    """
    Start a new batch processing session.
    Returns a unique batch_id to be used for all chunks of the batch.
    """
    try:
        batch_id = str(uuid.uuid4())
        batch_dir = os.path.join("data", batch_id)
        os.makedirs(batch_dir, exist_ok=True)

        # Create CSV file for this batch
        csv_path = os.path.join(batch_dir, 'results.csv')
        with open(csv_path, 'w', newline='') as csv_file:
            fieldnames = ['Image_Path_or_URL', 'Is_Valid', 'Error']
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

        # Store metadata in a JSON file
        metadata = {
            "csv_path": csv_path,
            "counts": {"valid": 0, "invalid": 0, "total": 0}
        }
        with open(os.path.join(batch_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f)

        return {"batch_id": batch_id}
    
    except Exception as e:
        logger.error(f"Error starting new batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-logo/batch/", response_model=List[LogoCheckResult])
@limiter.limit("20/minute")
async def check_logo_batch(
    request: Request,
    files: Optional[List[UploadFile]] = File(None),
    paths: Optional[str] = Form(None),
    batch_id: Optional[str] = Form(None)
):
    """
    Accepts either multiple uploaded files or a semicolon-separated string of image paths/URLs.
    Returns a list of logo detection results for each image, along with summary counts.
    Processes images sequentially.
    """
    results = []
    valid_count = 0
    invalid_count = 0

    # Validate batch_id if provided
    if batch_id:
        batch_dir = os.path.join("data", batch_id)
        metadata_path = os.path.join(batch_dir, 'metadata.json')
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=400, detail=f"Invalid batch_id: {batch_id}")

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        csv_path = metadata["csv_path"]
        csv_file = open(csv_path, 'a', newline='')
        csv_writer = csv.DictWriter(csv_file, fieldnames=['Image_Path_or_URL', 'Is_Valid', 'Error'])
    else:
        csv_file = None
        csv_writer = None

    try:
        # Handle uploaded files
        if files:
            for file in tqdm(files, desc="Processing uploaded files"):
                try:
                    # Create a temporary file
                    temp_file_path = os.path.join(UPLOAD_DIR, f"temp_{file.filename}")
                    with open(temp_file_path, "wb") as buffer:
                        file.file.seek(0)
                        shutil.copyfileobj(file.file, buffer)
                        file.file.seek(0)  # Reset original file pointer

                    # Process the file
                    result = process_single_path(temp_file_path)
                    result["Image_Path_or_URL"] = file.filename  # Use original filename
                    results.append(result)

                    # Append result to batch CSV if batch_id is given
                    if batch_id and csv_writer:
                        csv_writer.writerow({
                            'Image_Path_or_URL': result['Image_Path_or_URL'],
                            'Is_Valid': result['Is_Valid'],
                            'Error': result.get('Error', '')
                        })

                    # Update counts
                    if result["Is_Valid"] == "Valid":
                        valid_count += 1
                    else:
                        invalid_count += 1

                    # Clean up temporary file
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)

                except Exception as e:
                    logger.error(f"Error processing file {file.filename}: {str(e)}")
                    results.append({
                        "Image_Path_or_URL": file.filename,
                        "Is_Valid": "Invalid",
                        "Error": f"Error processing file: {str(e)}"
                    })
                    invalid_count += 1

        # Handle URL or path strings
        if paths:
            image_paths = [p.strip() for p in paths.split(";") if p.strip()]
            for path in tqdm(image_paths, desc="Processing image paths"):
                try:
                    result = process_single_path(path)
                    results.append(result)
                    # Append result to batch CSV if batch_id is given
                    if batch_id and csv_writer:
                        csv_writer.writerow({
                            'Image_Path_or_URL': result['Image_Path_or_URL'],
                            'Is_Valid': result['Is_Valid'],
                            'Error': result.get('Error', '')
                        })

                    if result["Is_Valid"] == "Valid":
                        valid_count += 1
                    else:
                        invalid_count += 1
                except Exception as e:
                    logger.error(f"Error processing path {path}: {str(e)}")
                    results.append({
                        "Image_Path_or_URL": path,
                        "Is_Valid": "Invalid",
                        "Error": str(e)
                    })
                    invalid_count += 1

        # Store both counts and results in app state
        request.app.state.last_batch_counts = {
            "valid": valid_count,
            "invalid": invalid_count,
            "total": len(results)
        }
        request.app.state.last_batch_results = results
        
        # Close CSV file if used
        if csv_file:
            csv_file.close()

        # Update global batch counts
        if batch_id:
            metadata["counts"]["valid"] += valid_count
            metadata["counts"]["invalid"] += invalid_count
            metadata["counts"]["total"] += len(results)
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f)

        return results
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))