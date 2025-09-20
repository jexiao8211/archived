"""
Authentication Router for ARCHIVED Application

This module handles authentication-related API endpoints including user registration,
login, and token refresh functionality.

Provides JWT-based authentication with access and refresh tokens.

Author: ARCHIVED Team
"""

from datetime import timedelta
from datetime import datetime, timezone

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status, APIRouter, Body
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import InvalidTokenError as JWTInvalidTokenError
from pydantic import BaseModel

from backend.auth.auth_handler import (
    create_access_token, 
    get_password_hash,
    verify_password
)
from backend.database import get_db
from backend.schemas import Token, UserCreate, UserResponse, UserUpdate
from backend.models import User
from backend.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# API Endpoints:
# POST      /auth/register       # Register a new user
# POST      /auth/token          # Login user and get auth token
# POST      /auth/refresh        # Refresh access token

class RefreshTokenRequest(BaseModel):
    """
    Schema for refresh token requests.
    
    Attributes:
        refresh_token (str): The refresh token to use for getting a new access token
    """
    refresh_token: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Register a new user account.
    
    Creates a new user account with the provided username, email, and password.
    The password is automatically hashed before storage.
    
    Args:
        user (UserCreate): User registration data
        db (Session): Database session
        
    Returns:
        UserResponse: The created user data (without password)
        
    Raises:
        HTTPException: If username or email already exists
    """
    # Check if username already exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        created_date=datetime.now(timezone.utc),
        updated_date=datetime.now(timezone.utc)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Token:
    """
    Authenticate user and return JWT tokens.
    
    Validates user credentials and returns both access and refresh tokens
    for authenticated API access.
    
    Args:
        form_data (OAuth2PasswordRequestForm): Login credentials (username/password)
        db (Session): Database session
        
    Returns:
        Token: JWT access and refresh tokens
        
    Raises:
        HTTPException: If credentials are invalid
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT tokens with configured expiration times
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = create_access_token(
        data={"sub": user.username}, expires_delta=refresh_token_expires, include_random=True
    )
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@router.post("/refresh", response_model=Token)
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Token:
    """
    Refresh an expired access token using a valid refresh token.
    
    Validates the refresh token and issues new access and refresh tokens.
    This allows users to maintain authentication without re-entering credentials.
    
    Args:
        request (RefreshTokenRequest): Contains the refresh token
        db (Session): Database session
        
    Returns:
        Token: New JWT access and refresh tokens
        
    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode and validate the refresh token
        payload = jwt.decode(request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTInvalidTokenError:
        raise credentials_exception

    # Verify the user still exists
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    # Create new tokens with fresh expiration times
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    # Issue a new refresh token as well for better security
    new_refresh_token = create_access_token(
        data={"sub": user.username}, expires_delta=refresh_token_expires, include_random=True
    )
    return Token(access_token=access_token, refresh_token=new_refresh_token, token_type="bearer")