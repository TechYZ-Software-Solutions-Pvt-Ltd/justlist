#!/usr/bin/env python3
"""
Backend startup script for Facility Finder API.
"""

import sys
import os
from pathlib import Path

# Add the src/app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'app'))

# Now we can import the modules
from database.connection import create_tables
from api import auth, facilities_simple
from api.delete_search_history import router as delete_history_router

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import time
from logging.handlers import RotatingFileHandler
import json

# Create FastAPI app
app = FastAPI(
    title="Facility Finder API",
    description="A powerful API for finding facilities using Google Places API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
cors_origins_env = os.getenv("CORS_ORIGINS", "")
# In development, allow all origins if CORS_ORIGINS not set
# In production, require CORS_ORIGINS to be set
is_production = os.getenv("ENVIRONMENT", "").lower() == "production"

if cors_origins_env:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    # Development mode: allow common localhost ports
    cors_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    # If not production, add more common development origins
    if not is_production:
        # Note: Cannot use ["*"] with allow_credentials=True
        # So we explicitly list common development origins
        cors_origins.extend([
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",  # Vite default
            "http://localhost:5174",
        ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,  # Changed to False to avoid issues with wildcard
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Logging setup (file + console, JSON lines)
logs_dir = Path(__file__).resolve().parent / "logs"
logs_dir.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("facility_finder")
if not logger.handlers:
    logger.setLevel(logging.INFO)
    class Tail50FileHandler(RotatingFileHandler):
        def emit(self, record: logging.LogRecord) -> None:
            super().emit(record)
            try:
                # Truncate file to last 50 lines to limit storage
                path = self.baseFilename
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                if len(lines) > 50:
                    with open(path, "w", encoding="utf-8") as f:
                        f.writelines(lines[-50:])
            except Exception:
                # Never let logging break the app
                pass

    file_handler = Tail50FileHandler(logs_dir / "app.log", maxBytes=256_000, backupCount=0, encoding="utf-8")
    console_handler = logging.StreamHandler()

    class JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            payload = {
                "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
                "level": record.levelname,
                "message": record.getMessage(),
                "logger": record.name,
            }
            if record.exc_info:
                payload["exc_info"] = self.formatException(record.exc_info)
            return json.dumps(payload, ensure_ascii=False)

    json_formatter = JsonFormatter()
    file_handler.setFormatter(json_formatter)
    console_handler.setFormatter(json_formatter)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

# Include API routers
app.include_router(auth.router)
app.include_router(facilities_simple.router)
app.include_router(delete_history_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    create_tables()
    logger.info("Database tables created successfully")


@app.get("/")
async def root():
    """Root endpoint."""
    resp = {
        "message": "Facility Finder API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }
    logger.info("root endpoint hit")
    return resp


@app.get("/health")
async def health_check(request: Request):
    """Health check endpoint."""
    origin = request.headers.get('origin', 'unknown')
    logger.info(f"health check from origin: {origin}")
    return {
        "status": "healthy", 
        "timestamp": "2024-01-01T00:00:00Z",
        "cors_configured": True,
        "request_origin": origin
    }


@app.post("/admin/reset-rate-limit")
async def reset_rate_limit_endpoint(request: Request):
    """Reset rate limit for the requesting IP (development only)."""
    from utils.security import reset_rate_limit, get_rate_limit_status
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    elif "x-real-ip" in request.headers:
        client_ip = request.headers["x-real-ip"].strip()
    
    # Only allow in development
    is_production = os.getenv("ENVIRONMENT", "").lower() == "production"
    if is_production:
        return JSONResponse(
            status_code=403,
            content={"detail": "Rate limit reset not allowed in production"}
        )
    
    reset_rate_limit(client_ip)
    status = get_rate_limit_status(client_ip)
    return {
        "message": "Rate limit reset successfully",
        "client_ip": client_ip,
        "status": status
    }


@app.get("/admin/rate-limit-status")
async def get_rate_limit_status_endpoint(request: Request):
    """Get rate limit status for the requesting IP."""
    from utils.security import get_rate_limit_status
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    elif "x-real-ip" in request.headers:
        client_ip = request.headers["x-real-ip"].strip()
    
    status = get_rate_limit_status(client_ip)
    return status


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Global HTTP exception handler."""
    try:
        body = await request.json()
    except Exception:
        body = None
    logger.warning(json.dumps({
        "event": "http_exception",
        "path": str(request.url),
        "method": request.method,
        "status_code": exc.status_code,
        "detail": exc.detail,
        "body": body,
    }, ensure_ascii=False))
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    try:
        body = await request.json()
    except Exception:
        body = None
    logger.error(json.dumps({
        "event": "unhandled_exception",
        "path": str(request.url),
        "method": request.method,
        "body": body,
    }, ensure_ascii=False), exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500}
    )


if __name__ == "__main__":
    # Run the server
    print("Starting Facility Finder API server...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("Press Ctrl+C to stop the server")
    
    uvicorn.run(
        "start_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )