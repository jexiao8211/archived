"""
User Management Router for ARCHIVED Application

This module handles user profile management and user-specific collection operations.
Provides endpoints for user information retrieval, profile updates, account deletion,
and collection management from the user's perspective.

All endpoints require authentication and operate on the current user's data.

Author: ARCHIVED Team
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from backend.database import get_db
from backend.models import User, Collection as CollectionModel
from backend.schemas import UserResponse, Collection, CollectionCreate, UserUpdate
from backend.auth.auth_handler import get_current_user
from backend.auth.auth_handler import authenticate_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_user)],
)

# API Endpoints:
# ---------- Current User Routes ---------- #
# GET       /users/me                   # Get current user's information
# PATCH     /users/me                   # Update user's username
# DELETE    /users/me                   # Delete user account

# ---------- User Collection Routes ---------- #
# GET       /users/me/collections       # List collections for current user
# POST      /users/me/collections       # Create a new collection for current user
# PATCH     /users/me/collections/order # Update the order of user's collections



# ---------- Current User Routes ---------- #
@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)) -> UserResponse:
    """
    Get information about the currently logged-in user.
    
    Returns the user's profile information including username, email,
    and account creation/update timestamps.
    
    Args:
        current_user (User): The authenticated user (injected by dependency)
        
    Returns:
        UserResponse: User profile information
    """
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_user(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Update the current user's username.
    
    Allows users to change their username with password verification for security.
    The new username must be unique and not already taken by another user.
    
    Args:
        update_data (UserUpdate): Contains new username and current password
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        UserResponse: Updated user profile information
        
    Raises:
        HTTPException: If password is incorrect or username is already taken
    """
    # Verify current password for security
    if not authenticate_user(db, current_user.username, update_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Check if new username is already taken by another user
    existing_user = db.query(User).filter(User.username == update_data.new_username).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Update username and timestamp
    current_user.username = update_data.new_username
    current_user.updated_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete the current user's account.
    
    Permanently deletes the user account and all associated data including
    collections, items, and images. Requires password verification for security.
    
    Args:
        current_password (str): User's current password for verification
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        None: No content returned on successful deletion
        
    Raises:
        HTTPException: If password is incorrect
        
    Note:
        This action is irreversible. All user data will be permanently deleted.
    """
    # Verify current password for security
    if not authenticate_user(db, current_user.username, current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Delete user and all associated data (cascade delete)
    db.delete(current_user)
    db.commit()
    return None


# ---------- User Collection Routes ---------- #
@router.get("/me/collections", response_model=List[Collection])
def get_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Collection]:
    """
    Get all collections for the current user.
    
    Returns a list of all collections owned by the authenticated user,
    including their items and metadata.
    
    Args:
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Collection]: List of user's collections with items
    """
    return current_user.collections

@router.post("/me/collections", response_model=Collection, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Collection:
    """
    Create a new collection for the current user.
    
    Creates a new collection with the provided name and description.
    The collection is automatically assigned the next available order position.
    
    Args:
        collection (CollectionCreate): Collection data (name and description)
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        Collection: The created collection with all metadata
    """
    # Get the next available order position for this user's collections
    max_order = db.query(func.max(CollectionModel.collection_order)).filter(
        CollectionModel.owner_id == current_user.id
    ).scalar()
    next_order = (max_order or 0) + 1

    # Create new collection
    new_collection = CollectionModel(
        name=collection.name,
        description=collection.description,
        owner_id=current_user.id,
        collection_order=next_order,
        created_date=datetime.now(timezone.utc),
        updated_date=datetime.now(timezone.utc)
    )
    db.add(new_collection)
    db.commit()
    db.refresh(new_collection)
    return new_collection


@router.patch("/me/collections/order", response_model=List[Collection])
def update_collection_order(
    order_update: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Collection]:
    """
    Update the display order of collections for the current user.
    
    Reorders the user's collections based on the provided list of collection IDs.
    The order in the list determines the new display order (0-based indexing).
    
    Args:
        order_update (List[int]): List of collection IDs in desired order
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Collection]: Updated collections in new order
        
    Raises:
        HTTPException: If no collections provided or IDs don't match user's collections
    """
    # Get all current collections for this user
    current_collections = db.query(CollectionModel).filter(
        CollectionModel.owner_id == current_user.id
    ).all()
    current_collection_ids = {col.id for col in current_collections}
    
    # Validate input data
    if len(order_update) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No collection orders provided"
        )
    
    # Ensure all provided collection IDs belong to the current user
    if set(current_collection_ids) != set(order_update):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collection IDs in order update must match exactly with current collections"
        )
    
    # Update collection orders based on their position in the list
    for order, collection_id in enumerate(order_update):
        collection = db.query(CollectionModel).filter(
            CollectionModel.id == collection_id,
            CollectionModel.owner_id == current_user.id
        ).first()
        
        if collection:
            collection.collection_order = order
            collection.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(current_user)
    
    # Return collections sorted by their new order
    sorted_collections = sorted(current_user.collections, key=lambda col: col.collection_order)
    return sorted_collections