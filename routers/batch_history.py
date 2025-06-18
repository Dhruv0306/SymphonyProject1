"""
Batch History Router

This module provides endpoints for retrieving batch processing history.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import List, Dict, Optional, Any
import os

import json
import glob
from datetime import datetime
import logging
import sys

from routers.batch import check_token_valid

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["batch_history"])

def admin_required(token: Optional[str] = Header(None, alias="X-Auth-Token")):
    """
    Dependency to ensure the user is authenticated as admin
    
    Args:
        token: Authentication token from header
        
    Returns:
        bool: True if authenticated
        
    Raises:
        HTTPException: If not authenticated
    """
    if not token or not check_token_valid(token):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return True


@router.get("/api/admin/batch-history")
def get_batch_history(
    _: bool = Depends(admin_required)
) -> List[Dict[str, Any]]:
    """
    Get history of all processed batches
    
    Returns:
        List[Dict]: List of batch history records
    """
    try:
        history = []
        
        # Get all CSV files in the exports directory
        export_dir = os.path.join(os.getcwd(), "exports")
        csv_files = glob.glob(os.path.join(export_dir, "*.csv"))
        
        for csv_file in csv_files:
            filename = os.path.basename(csv_file)
            
            # Extract batch ID from filename (assuming format like "logo_detection_BATCH_ID_timestamp.csv")
            parts = filename.split("_")
            if len(parts) >= 3:
                batch_id = parts[2]
                
                # Get file stats
                stats = os.stat(csv_file)
                created_time = datetime.fromtimestamp(stats.st_ctime).isoformat()
                file_size = stats.st_size
                
                # Try to get valid/invalid counts from a potential metadata file
                metadata_file = os.path.join(export_dir, f"metadata_{batch_id}.json")
                valid_count = 0
                invalid_count = 0
                total_count = 0
                
                if os.path.exists(metadata_file):
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                            valid_count = metadata.get("valid_count", 0)
                            invalid_count = metadata.get("invalid_count", 0)
                            total_count = metadata.get("total_count", 0)
                    except Exception as e:
                        logger.error(f"Error reading metadata file: {str(e)}")
                
                history.append({
                    "batch_id": batch_id,
                    "filename": filename,
                    "created_at": created_time,
                    "file_size": file_size,
                    "download_url": f"/api/exports/{filename}",
                    "valid_count": valid_count,
                    "invalid_count": invalid_count,
                    "total_count": total_count
                })
        
        # Sort by creation time (newest first)
        history.sort(key=lambda x: x["created_at"], reverse=True)
        
        return history
        
    except Exception as e:
        logger.error(f"Error retrieving batch history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving batch history: {str(e)}")


@router.get("/api/admin/batch/{batch_id}")
def get_batch_details(
    batch_id: str,
    _: bool = Depends(admin_required)
) -> Dict[str, Any]:
    """
    Get detailed information about a specific batch
    
    Args:
        batch_id: The ID of the batch to retrieve
        
    Returns:
        Dict: Batch details
        
    Raises:
        HTTPException: If batch not found
    """
    try:
        export_dir = os.path.join(os.getcwd(), "exports")
        
        # Look for CSV file with this batch ID
        csv_files = glob.glob(os.path.join(export_dir, f"*_{batch_id}_*.csv"))
        
        if not csv_files:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
            
        csv_file = csv_files[0]
        filename = os.path.basename(csv_file)
        
        # Get file stats
        stats = os.stat(csv_file)
        created_time = datetime.fromtimestamp(stats.st_ctime).isoformat()
        file_size = stats.st_size
        
        # Try to get additional metadata
        metadata_file = os.path.join(export_dir, f"metadata_{batch_id}.json")
        metadata = {}
        
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
            except Exception as e:
                logger.error(f"Error reading metadata file: {str(e)}")
        
        return {
            "batch_id": batch_id,
            "filename": filename,
            "created_at": created_time,
            "file_size": file_size,
            "download_url": f"/api/exports/{filename}",
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving batch details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving batch details: {str(e)}")