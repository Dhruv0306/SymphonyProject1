# Security Guide

The Symphony Logo Detection System implements enterprise-grade security measures to protect against common threats and ensure data integrity.

## Security Features

- **Authentication & Authorization:** Session-based admin authentication with CSRF protection
- **Input Validation:** Strict file type validation (JPG, PNG, WEBP, BMP only), URL validation, input sanitization
- **Rate Limiting:** Per-endpoint rate limits using SlowAPI with IP-based throttling
- **Data Protection:** Temporary files with automatic cleanup (30-minute cycles), 24-hour data retention
- **Network Security:** CORS protection, HTTPS support, security headers for XSS protection

## Environment Security Configuration

```bash
# Required security variables
ADMIN_USERNAME=your_secure_username
ADMIN_PASSWORD=your_strong_password
COOKIE_SECRET=your_secure_cookie_secret
SESSION_DURATION=1800  # 30 minutes

# Optional enhancements
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_ENABLED=true
SECURE_COOKIES=true
```

## Production Deployment Security

1. **Use HTTPS:** Always deploy with SSL/TLS certificates
2. **Strong Passwords:** Use complex, unique passwords for admin accounts
3. **Regular Updates:** Keep all dependencies updated to latest secure versions
4. **Firewall Configuration:** Restrict access to necessary ports only
5. **Reverse Proxy:** Use nginx or Apache for additional security

## Common Threats & Mitigations

| Threat | Mitigation | Implementation |
|--------|------------|----------------|
| **SQL Injection** | Input validation | Pydantic models, type checking |
| **XSS Attacks** | Input sanitization | HTML encoding, CSP headers |
| **CSRF Attacks** | CSRF tokens | CSRF middleware, token validation |
| **File Upload Attacks** | File validation | Type/size limits, secure storage |
| **DDoS Attacks** | Rate limiting | SlowAPI integration, IP-based limits |
| **Session Hijacking** | Secure cookies | HTTPS-only, automatic expiration |

## CSRF Protection

The system implements Cross-Site Request Forgery (CSRF) protection for admin endpoints:

```python
# Server-side CSRF token generation
@app.post("/api/admin/login")
async def admin_login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    # ... authentication logic ...
    csrf_token = generate_csrf_token()
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=True)
    return {"token": session_token, "csrf_token": csrf_token}

# CSRF token verification middleware
@app.middleware("http")
async def verify_csrf(request: Request, call_next):
    # Skip CSRF check for GET, OPTIONS, HEAD and non-admin paths
    if request.method in ["GET", "OPTIONS", "HEAD"] or "/api/admin/" not in request.url.path:
        return await call_next(request)

    token = request.headers.get("X-CSRF-Token")
    session_token = request.headers.get("X-Auth-Token")

    if not validate_csrf_token(session_token, token):
        return JSONResponse(status_code=403, content={"detail": "Invalid CSRF token"})

    return await call_next(request)
```

## Rate Limiting Configuration

Rate limiting is implemented using SlowAPI to prevent abuse:

```python
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app = limiter.limit("100/minute")(app)  # Global rate limit

# Endpoint-specific rate limits
@limiter.limit("100/minute")
@app.post("/api/check-logo/single/")
async def check_logo_single():
    ...

@limiter.limit("60/minute")
@app.post("/api/check-logo/batch/")
async def process_batch_images():
    ...

@limiter.limit("10/minute")
@app.get("/api/check-logo/batch/export-csv")
async def export_batch_csv():
    ...
```

## File Upload Security

The system implements several measures to secure file uploads:

```python
# File type validation
async def validate_image_file(file: UploadFile) -> bool:
    # Check file extension
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        return False
        
    # Check magic bytes/file signature
    try:
        content = await file.read(12)
        await file.seek(0)
        
        if content.startswith(b'\xFF\xD8\xFF'):  # JPEG signature
            return True
        elif content.startswith(b'\x89PNG\r\n\x1A\n'):  # PNG signature
            return True
        elif content.startswith(b'RIFF') and b'WEBP' in content:  # WEBP signature
            return True
        elif content.startswith(b'BM'):  # BMP signature
            return True
            
        return False
    except Exception:
        return False
```

## Secure Session Management

Sessions are securely managed with automatic expiration:

```python
# Session creation
def create_admin_session(username: str) -> str:
    session_token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(seconds=int(os.environ.get('SESSION_DURATION', '1800')))
    
    sessions[session_token] = {
        "username": username,
        "expiry": expiry
    }
    
    # Schedule cleanup of expired sessions
    schedule_session_cleanup()
    return session_token

# Session validation
def validate_session(token: str) -> bool:
    if token not in sessions:
        return False
        
    session = sessions[token]
    if datetime.now() > session["expiry"]:
        del sessions[token]
        return False
        
    # Extend session on active use
    session["expiry"] = datetime.now() + timedelta(seconds=int(os.environ.get('SESSION_DURATION', '1800')))
    return True
```

## CORS Configuration

Cross-Origin Resource Sharing is configured to protect against unauthorized cross-origin requests:

```python
# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-production-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)
```

## Security Headers

The following security headers are implemented to protect against common web vulnerabilities:

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking attacks
    response.headers["X-Frame-Options"] = "DENY"
    
    # Enable XSS protection in browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    # HTTP Strict Transport Security (when deployed with HTTPS)
    if not DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response
```

## Security Best Practices for Deployment

1. **Secure Environment Variables:** 
   - Store sensitive information in environment variables
   - Avoid hardcoding secrets in the codebase
   
2. **Regular Security Updates:**
   - Keep all dependencies updated
   - Monitor security advisories for FastAPI, React, and other components
   
3. **Access Control:**
   - Implement the principle of least privilege
   - Restrict access to admin endpoints

4. **Monitoring:**
   - Log authentication attempts
   - Monitor for abnormal API usage patterns
   - Track rate limit violations

5. **Production Configuration:**
   - Disable debug mode in production
   - Adjust rate limits based on expected traffic
   - Implement proper connection timeouts

## Security Support

For any security concerns or to report vulnerabilities, please contact the security team at security@symphony.com. 