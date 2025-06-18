"""
Dashboard Statistics Router

This module provides endpoints for retrieving dashboard statistics for the admin interface.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging
import os
import glob
import json
from datetime import datetime, timedelta

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["admin"])

# In-memory store for valid session tokens (imported from admin_auth)
from routers.admin_auth import valid_tokens

@router.get("/api/admin/dashboard-stats")
async def get_dashboard_stats(
    token: Optional[str] = Header(None, alias="X-Auth-Token")
):
    """
    Get dashboard statistics for the admin interface
    
    Args:
        token: Authentication token
        
    Returns:
        dict: Dashboard statistics
        
    Raises:
        HTTPException: If not authenticated
    """
    # Validate token
    if not token or token not in valid_tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Get all batch directories in the exports directory
        export_dir = os.path.join(os.getcwd(), "exports")
        batch_dirs = [d for d in glob.glob(os.path.join(export_dir, "*")) if os.path.isdir(d)]
        
        # Get today's date
        today = datetime.now().date()
        
        # Initialize counters
        batches_today = 0
        total_valid = 0
        total_invalid = 0
        total_processing_time = 0
        batches_with_time = 0
        
        for batch_dir in batch_dirs:
            metadata_file = os.path.join(batch_dir, "metadata.json")
            
            if not os.path.exists(metadata_file):
                continue
                
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                # Get file stats to determine creation date
                stats = os.stat(metadata_file)
                created_date = datetime.fromtimestamp(stats.st_ctime).date()
                
                # Count batches processed today
                if created_date == today:
                    batches_today += 1
                
                # Get counts for success rate calculation
                if "counts" in metadata:
                    total_valid += metadata["counts"].get("valid", 0)
                    total_invalid += metadata["counts"].get("invalid", 0)
                
                # Calculate processing time if available
                if "completed_at" in metadata and "created_at" in metadata:
                    processing_time = metadata["completed_at"] - metadata["created_at"]
                    total_processing_time += processing_time
                    batches_with_time += 1
                    
            except Exception as e:
                logger.error(f"Error reading metadata file {metadata_file}: {str(e)}")
        
        # Calculate success rate
        total_images = total_valid + total_invalid
        success_rate = (total_valid / total_images * 100) if total_images > 0 else 0
        success_rate = round(success_rate, 1)
        
        # Calculate average processing time in seconds
        avg_processing_time = (total_processing_time / batches_with_time) if batches_with_time > 0 else 0
        avg_processing_time = round(avg_processing_time, 1)
        
        # Calculate error rate
        error_rate = round(100 - success_rate, 1)
        
        return {
            "batches_today": batches_today,
            "success_rate": success_rate,
            "avg_processing_time": avg_processing_time,
            "error_rate": error_rate
        }
        
    except Exception as e:
        logger.error(f"Error retrieving dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving dashboard statistics")