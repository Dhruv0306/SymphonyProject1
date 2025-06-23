"""
Admin Authentication Router

This module provides endpoints for admin authentication, including login, logout,
and session verification. It implements secure token-based authentication with CSRF protection
and rate limiting for enhanced security.

Routes:
    POST /api/admin/login: Authenticate admin credentials and create session
    POST /api/admin/logout: End admin session and invalidate token 
    GET /api/admin/check-session: Verify if current session is authenticated
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

# Load environment variables from .env file
load_dotenv()

# Configure logging for the admin authentication module
logger = logging.getLogger(__name__)

# Initialize FastAPI router with admin tag for API documentation
router = APIRouter(tags=["admin"])

# Configure session duration from environment variable or use 30 min default
SESSION_DURATION = int(os.getenv("SESSION_DURATION", "1800"))

# In-memory storage for active session tokens
# Note: This will be cleared on server restart - consider persistent storage for production
valid_tokens = set()


@router.post("/api/admin/login")
async def admin_login(
    request: Request, username: str = Form(...), password: str = Form(...)
):
    """
    Authenticate admin user and create a new session.

    This endpoint validates admin credentials against environment variables,
    implements rate limiting per IP address, and generates secure session tokens
    with CSRF protection.

    Args:
        request: FastAPI request object containing client information
        username: Admin username submitted via form
        password: Admin password submitted via form

    Returns:
        dict: Contains status, message, session token and CSRF token

    Raises:
        HTTPException:
            - 429 if rate limit exceeded
            - 500 if admin credentials not configured
            - 401 if invalid credentials
    """
    # Extract client IP for rate limiting protection
    client_ip = request.client.host if request.client else "unknown"

    # Enforce rate limiting to prevent brute force attacks
    if login_rate_limiter.is_rate_limited(client_ip):
        logger.warning(f"Login rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429, detail="Too many login attempts. Please try again later."
        )

    # Retrieve admin credentials from environment variables
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")

    # Verify admin credentials are properly configured
    if not admin_username or not admin_password:
        logger.error("Admin credentials not configured in .env file")
        raise HTTPException(status_code=500, detail="Server configuration error")

    # Validate submitted credentials against stored admin credentials
    if username == admin_username and password == admin_password:
        # Generate cryptographically secure session token
        token = secrets.token_hex(16)
        valid_tokens.add(token)

        # Create CSRF token for protection against cross-site request forgery
        csrf_token = csrf_protection.generate_token()

        logger.info(f"Admin login successful for user: {username}")
        return {
            "status": "success",
            "message": "Login successful",
            "token": token,
            "csrf_token": csrf_token,
        }

    # Log and reject invalid login attempts
    logger.warning(f"Failed admin login attempt for user: {username}")
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/api/admin/logout")
def admin_logout(
    token: str = Header(..., alias="X-Auth-Token"),
    csrf_token: str = Header(..., alias="X-CSRF-Token"),
):
    """
    Terminate admin session by invalidating the session token.

    This endpoint validates the CSRF token before processing the logout
    to prevent CSRF attacks. The session token is removed from valid tokens.

    Args:
        token: Active session token to invalidate
        csrf_token: CSRF token that must match the session

    Returns:
        dict: Status message confirming successful logout

    Raises:
        HTTPException: 403 if CSRF token is invalid
    """
    # Verify CSRF token to prevent cross-site request forgery
    if not csrf_protection.validate_token(csrf_token):
        raise HTTPException(status_code=403, detail="Invalid CSRF token")

    # Remove session token from valid tokens
    if token in valid_tokens:
        valid_tokens.discard(token)

    logger.info("Admin logout successful")
    return {"status": "success", "message": "Logged out successfully"}


@router.get("/api/admin/check-session")
def check_admin_session(token: Optional[str] = Header(None, alias="X-Auth-Token")):
    """
    Verify if the current session token is valid and authenticated.

    This endpoint checks if the provided token exists in the set of valid
    session tokens. Used to validate session state on the client side.

    Args:
        token: Session token to validate

    Returns:
        dict: Contains authentication status

    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    # Log token details for debugging
    logger.info(f"Check-Session - Token received: {token}")
    logger.info(f"Valid tokens: {valid_tokens}")

    # Verify token exists and is valid
    if not token or token not in valid_tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return {"status": "success", "authenticated": True}
