"""
Security Utilities for API Protection

This module provides security utilities such as CSRF protection and rate limiting.
"""

import secrets
import time
from fastapi import Request, HTTPException, Depends, Header
from typing import Dict, Optional, Callable
import logging

logger = logging.getLogger(__name__)


# CSRF Protection
class CSRFProtection:
    """
    CSRF Protection middleware for FastAPI
    """

    def __init__(self):
        self.tokens: Dict[str, float] = {}  # token -> expiry time
        self.token_expiry = 3600  # 1 hour

    def generate_token(self) -> str:
        """Generate a new CSRF token"""
        token = secrets.token_hex(16)
        self.tokens[token] = time.time() + self.token_expiry
        return token

    def validate_token(self, token: str) -> bool:
        """Validate a CSRF token"""
        if token not in self.tokens:
            return False

        # Check if token is expired
        if time.time() > self.tokens[token]:
            del self.tokens[token]
            return False

        return True

    def clean_expired_tokens(self):
        """Clean expired tokens"""
        current_time = time.time()
        expired_tokens = [
            token for token, expiry in self.tokens.items() if current_time > expiry
        ]
        for token in expired_tokens:
            del self.tokens[token]


# Create a singleton instance
csrf_protection = CSRFProtection()


# Rate limiting for login attempts
class LoginRateLimiter:
    """
    Rate limiter for login attempts
    """

    def __init__(self):
        self.attempts: Dict[str, Dict] = {}  # IP -> {count, first_attempt}
        self.max_attempts = 5  # Maximum attempts within window
        self.window_seconds = 300  # 5 minutes

    def is_rate_limited(self, ip: str) -> bool:
        """Check if an IP is rate limited"""
        current_time = time.time()

        # Clean up old entries
        self._cleanup()

        if ip not in self.attempts:
            self.attempts[ip] = {"count": 1, "first_attempt": current_time}
            return False

        # Check if window has expired
        if current_time - self.attempts[ip]["first_attempt"] > self.window_seconds:
            # Reset counter for new window
            self.attempts[ip] = {"count": 1, "first_attempt": current_time}
            return False

        # Increment attempt count
        self.attempts[ip]["count"] += 1

        # Check if over limit
        if self.attempts[ip]["count"] > self.max_attempts:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return True

        return False

    def _cleanup(self):
        """Clean up expired entries"""
        current_time = time.time()
        expired_ips = [
            ip
            for ip, data in self.attempts.items()
            if current_time - data["first_attempt"] > self.window_seconds
        ]
        for ip in expired_ips:
            del self.attempts[ip]


# Create a singleton instance
login_rate_limiter = LoginRateLimiter()


# Dependency for CSRF protection
def csrf_protect(
    request: Request, csrf_token: Optional[str] = Header(None, alias="X-CSRF-Token")
):
    """
    Dependency to enforce CSRF protection

    Args:
        request: FastAPI request object
        csrf_token: CSRF token from header

    Raises:
        HTTPException: If CSRF validation fails
    """
    # Skip for GET, HEAD, OPTIONS requests
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    if not csrf_token or not csrf_protection.validate_token(csrf_token):
        raise HTTPException(status_code=403, detail="CSRF token missing or invalid")
