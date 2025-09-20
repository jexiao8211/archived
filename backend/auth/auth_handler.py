"""
Authentication Handler for ARCHIVED Application

This module provides authentication and authorization functionality including
password hashing, JWT token creation and validation, and user authentication.

Uses bcrypt for password hashing and JWT for token-based authentication.
Implements OAuth2 password flow for API authentication.

Author: ARCHIVED Team
"""

import jwt
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError as JWTInvalidTokenError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import TokenData
from ..models import User
from ..config import settings

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 password bearer scheme for token extraction
# Defines the OAuth2 Password flow and handles token extraction from requests
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against its hash.
    
    Args:
        plain_password (str): The plain text password to verify
        hashed_password (str): The hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password (str): The plain text password to hash
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)


def get_user(db: Session, username: str) -> User | None:
    """
    Retrieve a user from the database by username.
    
    Args:
        db (Session): Database session
        username (str): Username to search for
        
    Returns:
        User | None: User object if found, None otherwise
    """
    db_user = db.query(User).filter(User.username == username).first()
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> User | bool:
    """
    Authenticate a user with username and password.
    
    Args:
        db (Session): Database session
        username (str): Username to authenticate
        password (str): Plain text password to verify
        
    Returns:
        User | bool: User object if authentication successful, False otherwise
    """
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token with the provided data.
    
    Args:
        data (dict): Data to encode in the token (typically user information)
        expires_delta (timedelta, optional): Token expiration time. Defaults to 15 minutes.
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Verify the JWT token and return the authenticated user.
    
    This function is used as a dependency in protected endpoints to ensure
    the user is authenticated and to provide the current user object.
    
    Args:
        token (str): JWT token from the Authorization header
        db (Session): Database session
        
    Returns:
        User: The authenticated user object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTInvalidTokenError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current active user.
    
    This is a wrapper around get_current_user that can be extended
    to check for additional user status (e.g., active, verified, etc.).
    
    Args:
        current_user (User): The current authenticated user
        
    Returns:
        User: The current active user
    """
    return current_user