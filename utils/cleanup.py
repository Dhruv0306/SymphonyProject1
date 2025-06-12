import os
import shutil
import time
import logging
from datetime import datetime
from utils.file_ops import UPLOAD_DIR

logger = logging.getLogger(__name__)

def cleanup_old_batches(max_age_hours=24):
    """
    Clean up batch results older than specified hours
    Returns the number of directories cleaned up
    """
    try:
        batch_dir = "data"
        if not os.path.exists(batch_dir):
            logger.warning(f"Batch directory {batch_dir} does not exist")
            return 0

        current_time = time.time()
        cleaned_count = 0
        
        for batch_id in os.listdir(batch_dir):
            batch_path = os.path.join(batch_dir, batch_id)
            if os.path.isdir(batch_path):
                # Check directory age
                dir_age = current_time - os.path.getctime(batch_path)
                if dir_age > (max_age_hours * 3600):
                    try:
                        shutil.rmtree(batch_path)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old batch directory: {batch_id}")
                    except Exception as e:
                        logger.error(f"Error cleaning up batch directory {batch_id}: {str(e)}")
        
        return cleaned_count
    except Exception as e:
        logger.error(f"Error in cleanup_old_batches: {str(e)}")
        return 0

def cleanup_temp_uploads(max_age_minutes=30):
    """
    Clean up files in temp_uploads older than specified minutes
    Returns the number of files cleaned up
    """
    try:
        if not os.path.exists(UPLOAD_DIR):
            logger.warning(f"Upload directory {UPLOAD_DIR} does not exist")
            return 0

        current_time = time.time()
        cleaned_count = 0
        
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getctime(file_path)
                if file_age > (max_age_minutes * 60):
                    try:
                        os.remove(file_path)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old temporary file: {filename}")
                    except Exception as e:
                        logger.error(f"Error cleaning up temporary file {filename}: {str(e)}")
        
        return cleaned_count
    except Exception as e:
        logger.error(f"Error in cleanup_temp_uploads: {str(e)}")
        return 0

def log_cleanup_stats(batch_cleaned, temp_cleaned):
    """Log cleanup statistics"""
    logger.info(
        f"Cleanup completed at {datetime.now().isoformat()}\n"
        f"Batches cleaned: {batch_cleaned}\n"
        f"Temporary files cleaned: {temp_cleaned}"
    ) 