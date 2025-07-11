import os
from typing import Optional
from pydantic import BaseModel, field_validator
from pydantic_settings import BaseSettings
from urllib.parse import urljoin


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str
    
    # JWT Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configuration
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    
    # File Upload Configuration
    UPLOAD_DIR: str = "backend/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set[str] = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    
    # API Configuration
    API_BASE_URL: str = "http://localhost:8000"

    @property
    def UPLOAD_URL(self) -> str:
        """Combined URL for uploads: API_BASE_URL + UPLOAD_DIR"""
        from urllib.parse import urljoin
        return urljoin(self.API_BASE_URL, self.UPLOAD_DIR.lstrip('/'))
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
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
        if isinstance(v, str):
            return {ext.strip() for ext in v.split(",")}
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create a global settings instance
settings = Settings() 