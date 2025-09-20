"""
Database Configuration for ARCHIVED Application

This module handles database connection setup, session management,
and provides the database dependency for FastAPI endpoints.

Uses SQLAlchemy for ORM functionality and provides a dependency
injection pattern for database sessions.

Author: ARCHIVED Team
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from backend.models import Base
from backend.config import settings

# Create database engine
# The engine manages the database connection pool
engine = create_engine(settings.DATABASE_URL)

# Create session factory
# SessionLocal creates individual database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Metadata object for database schema management
metadata = MetaData()


def get_db():
    """
    Database dependency for FastAPI endpoints.
    
    Provides a database session that is automatically closed after use.
    This function is used as a dependency in FastAPI route handlers.
    
    Yields:
        Session: SQLAlchemy database session
        
    Note:
        The session is automatically closed when the request completes,
        ensuring proper resource cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create all database tables
# This ensures all models are properly created in the database
Base.metadata.create_all(bind=engine)