"""
Security Utilities for API Protection

This module provides security utilities such as CSRF protection and rate limiting.
It implements two main security features:
1. CSRF Protection - Prevents cross-site request forgery attacks
2. Rate Limiting - Protects against brute force login attempts

Author: Amazon Q
Version: 1.0
"""

import secrets
import time
from fastapi import Request, HTTPException, Depends, Header
from typing import Dict, Optional, Callable
import logging

# Configure logging for security events
logger = logging.getLogger(__name__)


class CSRFProtection:
    """
    CSRF Protection middleware for FastAPI applications.

    This class implements CSRF token generation and validation to protect
    against cross-site request forgery attacks. It maintains a dictionary
    of valid tokens with expiration times.

    Attributes:
        tokens (Dict[str, float]): Dictionary mapping tokens to expiry timestamps
        token_expiry (int): Token validity period in seconds (default 1 hour)
    """

    def __init__(self):
        # Store tokens with their expiration timestamps
        self.tokens: Dict[str, float] = {}  # token -> expiry time
        self.token_expiry = 3600  # 1 hour validity

    def generate_token(self) -> str:
        """
        Generate a new CSRF token using a cryptographically secure method.

        Returns:
            str: A 32-character hexadecimal CSRF token
        """
        token = secrets.token_hex(16)  # Generate 16 bytes = 32 hex chars
        self.tokens[token] = time.time() + self.token_expiry
        return token

    def validate_token(self, token: str) -> bool:
        """
        Validate a CSRF token and check if it has expired.

        Args:
            token (str): The CSRF token to validate

        Returns:
            bool: True if token is valid and not expired, False otherwise
        """
        # First check if token exists
        if token not in self.tokens:
            return False

        # Check token expiration
        if time.time() > self.tokens[token]:
            del self.tokens[token]  # Remove expired token
            return False

        return True

    def clean_expired_tokens(self):
        """
        Remove all expired tokens from the tokens dictionary.
        Should be called periodically to prevent memory leaks.
        """
        current_time = time.time()
        # Find all expired tokens
        expired_tokens = [
            token for token, expiry in self.tokens.items() if current_time > expiry
        ]
        # Remove expired tokens
        for token in expired_tokens:
            del self.tokens[token]


# Create a singleton instance for application-wide CSRF protection
csrf_protection = CSRFProtection()


class LoginRateLimiter:
    """
    Rate limiter for protecting login endpoints against brute force attacks.

    Implements a sliding window rate limiting algorithm that tracks login
    attempts per IP address within a specified time window.

    Attributes:
        attempts (Dict[str, Dict]): Dictionary tracking attempts per IP
        max_attempts (int): Maximum allowed attempts per window
        window_seconds (int): Size of sliding window in seconds
    """

    def __init__(self):
        # Track login attempts per IP address
        self.attempts: Dict[str, Dict] = {}  # IP -> {count, first_attempt}
        self.max_attempts = 5  # Maximum attempts within window
        self.window_seconds = 300  # 5 minute window

    def is_rate_limited(self, ip: str) -> bool:
        """
        Check if an IP address has exceeded the rate limit.

        Args:
            ip (str): The IP address to check

        Returns:
            bool: True if rate limit exceeded, False otherwise
        """
        current_time = time.time()

        # Remove expired entries first
        self._cleanup()

        # Initialize tracking for new IPs
        if ip not in self.attempts:
            self.attempts[ip] = {"count": 1, "first_attempt": current_time}
            return False

        # Reset counter if window has expired
        if current_time - self.attempts[ip]["first_attempt"] > self.window_seconds:
            self.attempts[ip] = {"count": 1, "first_attempt": current_time}
            return False

        # Track this attempt
        self.attempts[ip]["count"] += 1

        # Check if limit exceeded
        if self.attempts[ip]["count"] > self.max_attempts:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return True

        return False

    def _cleanup(self):
        """
        Remove expired entries from the attempts tracking dictionary.
        Called automatically before checking rate limits.
        """
        current_time = time.time()
        # Find expired entries
        expired_ips = [
            ip
            for ip, data in self.attempts.items()
            if current_time - data["first_attempt"] > self.window_seconds
        ]
        # Remove expired entries
        for ip in expired_ips:
            del self.attempts[ip]


# Create singleton instance for application-wide rate limiting
login_rate_limiter = LoginRateLimiter()


def csrf_protect(
    request: Request, csrf_token: Optional[str] = Header(None, alias="X-CSRF-Token")
):
    """
    FastAPI dependency for enforcing CSRF protection on endpoints.

    This function validates the CSRF token provided in request headers.
    GET, HEAD and OPTIONS requests are exempt from CSRF protection.

    Args:
        request (Request): The FastAPI request object
        csrf_token (Optional[str]): CSRF token from X-CSRF-Token header

    Raises:
        HTTPException: 403 error if CSRF validation fails
    """
    # Skip CSRF validation for safe methods
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    # Validate CSRF token
    if not csrf_token or not csrf_protection.validate_token(csrf_token):
        raise HTTPException(status_code=403, detail="CSRF token missing or invalid")
