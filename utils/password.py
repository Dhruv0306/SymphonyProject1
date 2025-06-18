"""
Password Hashing Utility

This module provides functions for secure password hashing and verification.
"""

import hashlib
import os
import base64
import logging

logger = logging.getLogger(__name__)

def hash_password(password: str) -> tuple:
    """
    Hash a password with a random salt using PBKDF2
    
    Args:
        password: The password to hash
        
    Returns:
        tuple: (salt, hashed_password)
    """
    # Generate a random salt
    salt = os.urandom(32)
    
    # Hash the password with the salt
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000  # Number of iterations
    )
    
    # Return the salt and key as base64 strings
    return (
        base64.b64encode(salt).decode('utf-8'),
        base64.b64encode(key).decode('utf-8')
    )

def verify_password(stored_salt: str, stored_hash: str, password: str) -> bool:
    """
    Verify a password against a stored hash
    
    Args:
        stored_salt: Base64-encoded salt
        stored_hash: Base64-encoded hash
        password: Password to verify
        
    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        # Decode the stored salt
        salt = base64.b64decode(stored_salt)
        
        # Hash the provided password with the stored salt
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000  # Number of iterations
        )
        
        # Compare the hashes
        return base64.b64encode(key).decode('utf-8') == stored_hash
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        return False