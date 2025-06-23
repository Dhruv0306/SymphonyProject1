import logging
from logging.handlers import RotatingFileHandler


def setup_logging():
    """
    Configure and set up logging with rotating file handler.

    This function sets up a comprehensive logging system with the following features:
    - Rotating file handler that creates new files when size limit is reached
    - Configures root logger and application-specific logger
    - Suppresses watchfiles logging noise
    - Uses UTF-8 encoding for log files

    Returns:
        logging.Logger: Configured logger instance for the application
    """
    # Define logging constants
    LOG_FILE = "logs.txt"  # Name of the log file
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"  # Standard log format with timestamp, logger name, level and message

    # Initialize rotating file handler with size-based rotation
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10MB per file - prevents unbounded log growth
        backupCount=5,  # Maintain 5 backup files for log history
        encoding="utf-8",  # Ensure proper handling of unicode characters
    )
    file_handler.setLevel(logging.INFO)  # Set minimum logging level
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))  # Apply standard format

    # Reset and configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    # Remove any existing handlers to prevent duplicate logging
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    root_logger.addHandler(file_handler)

    # Create application-specific logger instance
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    # Configure watchfiles logger to minimize noise
    # Only log errors from watchfiles to prevent cluttering logs
    watchfiles_logger = logging.getLogger("watchfiles")
    watchfiles_logger.setLevel(logging.ERROR)

    return logger
