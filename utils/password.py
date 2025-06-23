"""
Password Hashing Utility

This module provides functions for secure password hashing and verification using PBKDF2-HMAC-SHA256.
The implementation uses a random 32-byte salt and 100,000 iterations for enhanced security.

Functions:
    hash_password: Generates a salted hash for a password
    verify_password: Verifies a password against a stored hash
"""

import hashlib
import os
import base64
import logging

# Configure logging for the password hashing module
logger = logging.getLogger(__name__)


def hash_password(password: str) -> tuple:
    """
    Hash a password with a cryptographically secure random salt using PBKDF2-HMAC-SHA256.

    The function uses a 32-byte random salt and 100,000 iterations to generate a secure hash.
    Both the salt and resulting hash are base64 encoded for storage.

    Args:
        password (str): The plaintext password to hash

    Returns:
        tuple: A tuple containing:
            - salt (str): Base64 encoded random salt
            - hash (str): Base64 encoded password hash

    Example:
        >>> salt, hash = hash_password("mypassword123")
    """
    # Generate a cryptographically secure random salt (32 bytes recommended for PBKDF2)
    salt = os.urandom(32)

    # Hash the password using PBKDF2-HMAC-SHA256
    # 100,000 iterations is recommended by NIST guidelines
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, 100000  # Number of iterations
    )

    # Encode both salt and hash in base64 for safe storage
    return (
        base64.b64encode(salt).decode("utf-8"),
        base64.b64encode(key).decode("utf-8"),
    )


def verify_password(stored_salt: str, stored_hash: str, password: str) -> bool:
    """
    Verify a password against a stored hash using constant-time comparison.

    This function recreates the hash using the stored salt and provided password,
    then performs a constant-time comparison with the stored hash to prevent timing attacks.

    Args:
        stored_salt (str): The base64-encoded salt used in the original hash
        stored_hash (str): The base64-encoded hash to verify against
        password (str): The plaintext password to verify

    Returns:
        bool: True if the password matches, False if it doesn't match or if an error occurs

    Example:
        >>> is_valid = verify_password(stored_salt, stored_hash, "mypassword123")
    """
    try:
        # Decode the stored base64 salt back to bytes
        salt = base64.b64decode(stored_salt)

        # Recreate the hash using the same parameters as the original
        key = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, 100000  # Number of iterations
        )

        # Perform constant-time comparison of the hashes
        return base64.b64encode(key).decode("utf-8") == stored_hash
    except Exception as e:
        # Log any errors that occur during verification
        logger.error(f"Error verifying password: {str(e)}")
        return False
