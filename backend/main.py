"""
ARCHIVED Backend Application

A FastAPI-based backend for the ARCHIVED application, providing REST API endpoints
for managing collections, items, images, and user authentication.

This module sets up the FastAPI application with all necessary middleware,
routers, and configuration for the ARCHIVED backend service.

Author: ARCHIVED Team
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import engine, Base
from backend.routers import auth, images, users, collections, items, contact
from backend.routers import share
from backend.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title="ARCHIVED API",
    description="Backend API for the ARCHIVED application - a collection management system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static files for image serving
# This allows images to be served at /backend/uploads/<filename>
app.mount("/backend/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Configure CORS middleware
# CORS (Cross-Origin Resource Sharing) allows the frontend to make requests
# to the backend from different origins (domains, ports, protocols)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # List of allowed origins
    allow_credentials=True,  # Allows cookies and authorization headers
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],  # Allowed HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Include API routers
# Each router handles a specific domain of the application
app.include_router(auth.router)        # Authentication endpoints
app.include_router(users.router)       # User management endpoints
app.include_router(collections.router) # Collection management endpoints
app.include_router(items.router)       # Item management endpoints
app.include_router(images.router)      # Image management endpoints
app.include_router(contact.router)     # Contact form endpoints
app.include_router(share.router)       # Collection sharing endpoints


def main():
    """
    Main entry point for running the application.
    
    Starts the uvicorn server with the configured host and port settings.
    """
    uvicorn.run(
        app, 
        host=settings.HOST,  # Run on all available network interfaces
        port=settings.PORT   # Use configured port (default: 8000)
    )


if __name__ == "__main__":
    main()
