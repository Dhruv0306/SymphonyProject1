import os
import shutil
import time
import logging
from datetime import datetime
from utils.file_ops import UPLOAD_DIR

logger = logging.getLogger(__name__)


def cleanup_old_batches(max_age_hours=24):
    """
    Clean up batch results directories that are older than the specified age threshold.

    This function scans the exports directory and removes any subdirectories that were
    created more than max_age_hours ago. It handles errors gracefully and logs all
    operations.

    Args:
        max_age_hours (int): Maximum age in hours before a batch directory is cleaned up.
                            Defaults to 24 hours.

    Returns:
        int: Number of directories that were successfully cleaned up.
    """
    try:
        # Log start of cleanup process
        print(f"\nStarting cleanup of old batches (older than {max_age_hours} hours)")
        batch_dir = "exports"

        # Verify exports directory exists
        if not os.path.exists(batch_dir):
            print(f"Batch directory {batch_dir} does not exist")
            logger.warning(f"Batch directory {batch_dir} does not exist")
            return 0

        current_time = time.time()
        cleaned_count = 0
        total_dirs = 0

        # Scan all subdirectories in exports folder
        print(f"Scanning directory: {batch_dir}")
        for batch_id in os.listdir(batch_dir):
            batch_path = os.path.join(batch_dir, batch_id)
            if os.path.isdir(batch_path):
                total_dirs += 1
                # Calculate directory age in hours
                dir_age = current_time - os.path.getctime(batch_path)
                age_hours = dir_age / 3600
                print(f"Found batch: {batch_id}, Age: {age_hours:.2f} hours")

                # Remove directories older than threshold
                if dir_age > (max_age_hours * 3600):
                    try:
                        print(f"Removing old batch: {batch_id}")
                        shutil.rmtree(batch_path)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old batch directory: {batch_id}")
                    except Exception as e:
                        print(f"Error cleaning batch {batch_id}: {str(e)}")
                        logger.error(
                            f"Error cleaning up batch directory {batch_id}: {str(e)}"
                        )

        # Log cleanup completion statistics
        print(
            f"Batch cleanup complete. Processed {total_dirs} directories, removed {cleaned_count}"
        )
        return cleaned_count
    except Exception as e:
        print(f"Error in cleanup_old_batches: {str(e)}")
        logger.error(f"Error in cleanup_old_batches: {str(e)}")
        return 0


def cleanup_temp_uploads(max_age_minutes=30):
    """
    Clean up temporary upload files that are older than the specified age threshold.

    This function scans the temporary uploads directory and removes any files that were
    created more than max_age_minutes ago. It handles errors gracefully and logs all
    operations.

    Args:
        max_age_minutes (int): Maximum age in minutes before a temporary file is cleaned up.
                              Defaults to 30 minutes.

    Returns:
        int: Number of files that were successfully cleaned up.
    """
    try:
        # Log start of cleanup process
        print(
            f"\nStarting cleanup of temp uploads (older than {max_age_minutes} minutes)"
        )

        # Verify uploads directory exists
        if not os.path.exists(UPLOAD_DIR):
            print(f"Upload directory {UPLOAD_DIR} does not exist")
            logger.warning(f"Upload directory {UPLOAD_DIR} does not exist")
            return 0

        current_time = time.time()
        cleaned_count = 0
        total_files = 0

        # Scan all files in uploads directory
        print(f"Scanning directory: {UPLOAD_DIR}")
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(file_path):
                total_files += 1
                # Calculate file age in minutes
                file_age = current_time - os.path.getctime(file_path)
                age_minutes = file_age / 60
                print(f"Found file: {filename}, Age: {age_minutes:.2f} minutes")

                # Remove files older than threshold
                if file_age > (max_age_minutes * 60):
                    try:
                        print(f"Removing old file: {filename}")
                        os.remove(file_path)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old temporary file: {filename}")
                    except Exception as e:
                        print(f"Error cleaning file {filename}: {str(e)}")
                        logger.error(
                            f"Error cleaning up temporary file {filename}: {str(e)}"
                        )

        # Log cleanup completion statistics
        print(
            f"Temp cleanup complete. Processed {total_files} files, removed {cleaned_count}"
        )
        return cleaned_count
    except Exception as e:
        print(f"Error in cleanup_temp_uploads: {str(e)}")
        logger.error(f"Error in cleanup_temp_uploads: {str(e)}")
        return 0


def log_cleanup_stats(batch_cleaned, temp_cleaned):
    """
    Log statistics about the cleanup operations.

    This function takes the results from both cleanup operations and logs them
    with a timestamp for record keeping.

    Args:
        batch_cleaned (int): Number of batch directories that were cleaned up
        temp_cleaned (int): Number of temporary files that were cleaned up
    """
    # Generate timestamp and log statistics
    timestamp = datetime.now().isoformat()
    print(f"\nCleanup Statistics at {timestamp}")
    print(f"Batches cleaned: {batch_cleaned}")
    print(f"Temporary files cleaned: {temp_cleaned}")

    logger.info(
        f"Cleanup completed at {timestamp}\n"
        f"Batches cleaned: {batch_cleaned}\n"
        f"Temporary files cleaned: {temp_cleaned}"
    )
