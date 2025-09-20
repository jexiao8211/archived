"""
Configuration Settings for ARCHIVED Application

This module defines all application settings using Pydantic BaseSettings,
which automatically loads configuration from environment variables.

Settings are organized by category (database, authentication, server, etc.)
and include validation to ensure proper configuration values.

Author: ARCHIVED Team
"""

import os
from typing import Optional
from pydantic import BaseModel, field_validator
from pydantic_settings import BaseSettings
from urllib.parse import urljoin


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This class uses Pydantic BaseSettings to automatically load configuration
    from environment variables with type validation and default values.
    
    All settings can be overridden by setting corresponding environment variables.
    """
    
    # Database Configuration
    DATABASE_URL: str  # Required: Database connection string
    
    # JWT Authentication Configuration
    SECRET_KEY: str  # Required: Secret key for JWT token signing (min 32 chars)
    ALGORITHM: str = "HS256"  # JWT signing algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Access token lifetime in minutes
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60*24*7  # Refresh token lifetime (1 week)
    
    # Server Configuration
    HOST: str = "0.0.0.0"  # Server host (0.0.0.0 for all interfaces)
    PORT: int = 8000  # Server port
    
    # CORS Configuration
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]  # Allowed frontend origins
    
    # File Upload Configuration
    UPLOAD_DIR: str = "backend/uploads"  # Directory for uploaded files
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # Maximum file size (10MB)
    ALLOWED_EXTENSIONS: set[str] = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}  # Allowed file types
    
    # API Configuration
    API_BASE_URL: str = "http://localhost:8000"  # Base URL for API endpoints
    
    # Email Configuration (for contact form)
    SMTP_SERVER: str = "smtp.gmail.com"  # SMTP server for sending emails
    SMTP_PORT: int = 587  # SMTP server port
    SMTP_USERNAME: Optional[str] = None  # SMTP username (optional)
    SMTP_PASSWORD: Optional[str] = None  # SMTP password (optional)
    ADMIN_EMAIL: Optional[str] = None  # Admin email for contact form notifications

    # Rate Limiting Configuration
    RATE_LIMIT_MAX_REQUESTS: int = 3  # Max contact form submissions per window
    RATE_LIMIT_WINDOW_SECONDS: int = 3600  # Rate limit window (1 hour)
    
    @property
    def UPLOAD_URL(self) -> str:
        """
        Generate the complete URL for uploaded files.
        
        Combines the API base URL with the upload directory path
        to create the full URL where uploaded files can be accessed.
        
        Returns:
            str: Complete URL for accessing uploaded files
        """
        from urllib.parse import urljoin
        return urljoin(self.API_BASE_URL, self.UPLOAD_DIR.lstrip('/'))
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v):
        """
        Validate that the secret key meets security requirements.
        
        Args:
            v (str): The secret key value to validate
            
        Returns:
            str: The validated secret key
            
        Raises:
            ValueError: If the secret key is too short
        """
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """
        Parse CORS origins from various input formats.
        
        Accepts either a comma-separated string or a list of strings.
        Handles empty strings and trims whitespace.
        
        Args:
            v: CORS origins as string or list
            
        Returns:
            List[str]: List of parsed CORS origins
            
        Raises:
            ValueError: If the input format is invalid
        """
        if isinstance(v, str):
            # Handle empty string
            if not v.strip():
                return []
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        raise ValueError("CORS_ORIGINS must be a comma-separated string or a list of strings")
    
    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_allowed_extensions(cls, v):
        """
        Parse allowed file extensions from string or set format.
        
        Accepts either a comma-separated string or a set of strings.
        
        Args:
            v: File extensions as string or set
            
        Returns:
            Set[str]: Set of parsed file extensions
        """
        if isinstance(v, str):
            return {ext.strip() for ext in v.split(",")}
        return v
    
    class Config:
        """
        Pydantic configuration for settings.
        
        Configures how environment variables are loaded and parsed.
        """
        env_file = ".env"  # Load from .env file
        env_file_encoding = "utf-8"  # Use UTF-8 encoding
        case_sensitive = True  # Environment variable names are case-sensitive


# Create a global settings instance
# This instance is imported and used throughout the application
settings = Settings() 