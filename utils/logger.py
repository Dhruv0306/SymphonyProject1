import logging
from logging.handlers import RotatingFileHandler


def setup_logging():
    # Configure rotating file logging
    # Logs are rotated when they reach 10MB, keeping up to 5 backup files
    LOG_FILE = "logs.txt"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10MB per file
        backupCount=5,  # Keep 5 backup files
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))

    # Configure root logger with file handler only
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    root_logger.addHandler(file_handler)

    # Set up application-specific logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    # Suppress watchfiles logs but maintain file logging
    watchfiles_logger = logging.getLogger("watchfiles")
    watchfiles_logger.setLevel(logging.ERROR)

    return logger
