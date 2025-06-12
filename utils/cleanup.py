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
        print(f"\nStarting cleanup of old batches (older than {max_age_hours} hours)")
        batch_dir = "data"
        if not os.path.exists(batch_dir):
            print(f"Batch directory {batch_dir} does not exist")
            logger.warning(f"Batch directory {batch_dir} does not exist")
            return 0

        current_time = time.time()
        cleaned_count = 0
        total_dirs = 0
        
        print(f"Scanning directory: {batch_dir}")
        for batch_id in os.listdir(batch_dir):
            batch_path = os.path.join(batch_dir, batch_id)
            if os.path.isdir(batch_path):
                total_dirs += 1
                # Check directory age
                dir_age = current_time - os.path.getctime(batch_path)
                age_hours = dir_age / 3600
                print(f"Found batch: {batch_id}, Age: {age_hours:.2f} hours")
                
                if dir_age > (max_age_hours * 3600):
                    try:
                        print(f"Removing old batch: {batch_id}")
                        shutil.rmtree(batch_path)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old batch directory: {batch_id}")
                    except Exception as e:
                        print(f"Error cleaning batch {batch_id}: {str(e)}")
                        logger.error(f"Error cleaning up batch directory {batch_id}: {str(e)}")
        
        print(f"Batch cleanup complete. Processed {total_dirs} directories, removed {cleaned_count}")
        return cleaned_count
    except Exception as e:
        print(f"Error in cleanup_old_batches: {str(e)}")
        logger.error(f"Error in cleanup_old_batches: {str(e)}")
        return 0

def cleanup_temp_uploads(max_age_minutes=30):
    """
    Clean up files in temp_uploads older than specified minutes
    Returns the number of files cleaned up
    """
    try:
        print(f"\nStarting cleanup of temp uploads (older than {max_age_minutes} minutes)")
        if not os.path.exists(UPLOAD_DIR):
            print(f"Upload directory {UPLOAD_DIR} does not exist")
            logger.warning(f"Upload directory {UPLOAD_DIR} does not exist")
            return 0

        current_time = time.time()
        cleaned_count = 0
        total_files = 0
        
        print(f"Scanning directory: {UPLOAD_DIR}")
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(file_path):
                total_files += 1
                file_age = current_time - os.path.getctime(file_path)
                age_minutes = file_age / 60
                print(f"Found file: {filename}, Age: {age_minutes:.2f} minutes")
                
                if file_age > (max_age_minutes * 60):
                    try:
                        print(f"Removing old file: {filename}")
                        os.remove(file_path)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old temporary file: {filename}")
                    except Exception as e:
                        print(f"Error cleaning file {filename}: {str(e)}")
                        logger.error(f"Error cleaning up temporary file {filename}: {str(e)}")
        
        print(f"Temp cleanup complete. Processed {total_files} files, removed {cleaned_count}")
        return cleaned_count
    except Exception as e:
        print(f"Error in cleanup_temp_uploads: {str(e)}")
        logger.error(f"Error in cleanup_temp_uploads: {str(e)}")
        return 0

def log_cleanup_stats(batch_cleaned, temp_cleaned):
    """Log cleanup statistics"""
    timestamp = datetime.now().isoformat()
    print(f"\nCleanup Statistics at {timestamp}")
    print(f"Batches cleaned: {batch_cleaned}")
    print(f"Temporary files cleaned: {temp_cleaned}")
    
    logger.info(
        f"Cleanup completed at {timestamp}\n"
        f"Batches cleaned: {batch_cleaned}\n"
        f"Temporary files cleaned: {temp_cleaned}"
    ) 