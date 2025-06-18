"""
Admin Authentication Router

This module provides endpoints for admin authentication, including login, logout,
and session verification.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Request, Form, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import Optional
import os
import secrets
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from utils.security import csrf_protection, login_rate_limiter, csrf_protect

# Load environment variables
load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["admin"])

# Session duration in seconds (from .env or default to 30 minutes)
SESSION_DURATION = int(os.getenv("SESSION_DURATION", "1800"))

# In-memory store for valid session tokens
valid_tokens = set()


@router.post("/api/admin/login")
async def admin_login(
    request: Request, username: str = Form(...), password: str = Form(...)
):
    """
    Authenticate admin user and return a session token

    Args:
        request: FastAPI request object
        username: Admin username
        password: Admin password

    Returns:
        dict: Login status message with token

    Raises:
        HTTPException: If credentials are invalid
    """
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"

    # Check rate limiting
    if login_rate_limiter.is_rate_limited(client_ip):
        logger.warning(f"Login rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429, detail="Too many login attempts. Please try again later."
        )

    # Get admin credentials from environment variables
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")

    # Check if credentials are configured
    if not admin_username or not admin_password:
        logger.error("Admin credentials not configured in .env file")
        raise HTTPException(status_code=500, detail="Server configuration error")

    # Validate credentials
    if username == admin_username and password == admin_password:
        # Generate a secure token
        token = secrets.token_hex(16)
        valid_tokens.add(token)  # Store token in memory

        # Generate CSRF token
        csrf_token = csrf_protection.generate_token()

        logger.info(f"Admin login successful for user: {username}")
        return {
            "status": "success",
            "message": "Login successful",
            "token": token,
            "csrf_token": csrf_token,
        }

    # Log failed login attempt
    logger.warning(f"Failed admin login attempt for user: {username}")
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/api/admin/logout")
def admin_logout(
    token: str = Header(..., alias="X-Auth-Token"),
    csrf_token: str = Header(..., alias="X-CSRF-Token"),
):
    """
    Log out admin user by invalidating token

    Args:
        token: Authentication token
        csrf_token: CSRF token

    Returns:
        dict: Logout status message
    """
    # Validate CSRF token
    if not csrf_protection.validate_token(csrf_token):
        raise HTTPException(status_code=403, detail="Invalid CSRF token")

    # Invalidate token
    if token in valid_tokens:
        valid_tokens.discard(token)

    logger.info("Admin logout successful")
    return {"status": "success", "message": "Logged out successfully"}


@router.get("/api/admin/check-session")
def check_admin_session(token: Optional[str] = Header(None, alias="X-Auth-Token")):
    """
    Check if the current session is authenticated as admin

    Args:
        token: Authentication token

    Returns:
        dict: Session status

    Raises:
        HTTPException: If not authenticated
    """
    logger.info(f"Check-Session - Token received: {token}")
    logger.info(f"Valid tokens: {valid_tokens}")

    if not token or token not in valid_tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {"status": "success", "authenticated": True}
