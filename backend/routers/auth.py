from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from backend.auth.auth_handler import (
    authenticate_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    create_access_token, 
    get_password_hash,
    get_current_user
)
from backend.database import get_db
from backend.schemas import Token, UserCreate, UserResponse, UserUpdate
from backend.models import User

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# POST      /auth/register     # register a new user
# PATCH     /auth/me          # update user info
# DELETE    /auth/me          # delete account

# POST      /auth/token

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
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
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/me", response_model=UserResponse)
def update_user(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update username. Requires password verification for security."""
    # Verify current password
    if not authenticate_user(db, current_user.username, update_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Check if new username is already taken
    existing_user = db.query(User).filter(User.username == update_data.new_username).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Update username
    current_user.username = update_data.new_username
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user account. Requires password verification for security."""
    # Verify current password
    if not authenticate_user(db, current_user.username, current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Delete user
    db.delete(current_user)
    db.commit()
    return None

@router.post("/token")
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
) -> Token:
    """Get the JWT token from user credentials."""
    
    # Verify credentials
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")