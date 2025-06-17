"""
Admin Authentication Router

This module provides endpoints for admin authentication, including login, logout,
and session verification.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Request, Form, Cookie
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import Optional
import os
import secrets
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["admin"])

# Session duration in seconds (from .env or default to 30 minutes)
SESSION_DURATION = int(os.getenv("SESSION_DURATION", "1800"))

# Cookie name for admin session
ADMIN_SESSION_COOKIE = "admin_session"

# Cookie secret for additional security
COOKIE_SECRET = os.getenv("COOKIE_SECRET", secrets.token_hex(16))

@router.post("/api/admin/login")
def admin_login(
    response: Response, 
    username: str = Form(...), 
    password: str = Form(...)
):
    """
    Authenticate admin user and set session cookie
    
    Args:
        response: FastAPI response object for setting cookies
        username: Admin username
        password: Admin password
        
    Returns:
        dict: Login status message
        
    Raises:
        HTTPException: If credentials are invalid
    """
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
        
        # Set secure cookie with the token
        response.set_cookie(
            key=ADMIN_SESSION_COOKIE,
            value=token,
            max_age=SESSION_DURATION,
            httponly=True,
            samesite="strict",
            secure=os.getenv("ENVIRONMENT", "development") == "production"
        )
        
        logger.info(f"Admin login successful for user: {username}")
        return {"status": "success", "message": "Login successful"}
    
    # Log failed login attempt
    logger.warning(f"Failed admin login attempt for user: {username}")
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/api/admin/logout")
def admin_logout(response: Response):
    """
    Log out admin user by clearing session cookie
    
    Args:
        response: FastAPI response object for clearing cookies
        
    Returns:
        dict: Logout status message
    """
    response.delete_cookie(
        key=ADMIN_SESSION_COOKIE,
        httponly=True,
        samesite="strict",
        secure=os.getenv("ENVIRONMENT", "development") == "production"
    )
    
    logger.info("Admin logout successful")
    return {"status": "success", "message": "Logged out successfully"}


@router.get("/api/admin/check-session")
def check_admin_session(
    request: Request,
    session: Optional[str] = Cookie(None, alias=ADMIN_SESSION_COOKIE)
):
    """
    Check if the current session is authenticated as admin
    
    Args:
        request: FastAPI request object
        session: Session cookie value
        
    Returns:
        dict: Session status
        
    Raises:
        HTTPException: If not authenticated
    """
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {"status": "success", "authenticated": True}