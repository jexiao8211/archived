from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from backend.database import get_db
from backend.models import User, Collection as CollectionModel
from backend.schemas import UserResponse, Collection, CollectionCreate, UserUpdate, CollectionOrderUpdate
from backend.auth.auth_handler import get_current_user
from backend.auth.auth_handler import authenticate_user

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


# GET       /users/me                   # Get current user's information
# PATCH     /users/me                   # Update user's username
# DELETE    /users/me                   # Delete user

# GET       /users/me/collections       # list collections for a user
# POST      /users/me/collections       # create a collection for a user


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get information about the currently logged-in user."""
    return current_user

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
    current_user.update_date=datetime.now(timezone.utc)
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


@router.get("/me/collections", response_model=List[Collection])
def get_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all collections for the current user."""
    return current_user.collections

@router.post("/me/collections", response_model=Collection, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new collection for the current user."""
    max_order = db.query(func.max(CollectionModel.collection_order)).filter(
        CollectionModel.owner_id == current_user.id
    ).scalar()
    next_order = (max_order or 0) + 1

    collection = CollectionModel(
        name=collection.name,
        description=collection.description,
        owner_id=current_user.id,
        collection_order=next_order,
        created_date=datetime.now(timezone.utc),
        updated_date=datetime.now(timezone.utc)
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection

@router.patch("/me/collections/order", response_model=List[Collection])
def update_collection_order(
    order_update: CollectionOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the order of collections for a user."""
    
    # Get all current collections for this user
    current_collections = db.query(CollectionModel).filter(
        CollectionModel.owner_id == current_user.id
    ).all()
    current_collection_ids = {col.id for col in current_collections}
    
    # Validate input data
    if not order_update.collection_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No collection orders provided"
        )
    
    # Check 1: Ensure all current collections are included
    provided_collection_ids = {order_data.id for order_data in order_update.collection_orders}
    missing_collections = current_collection_ids - provided_collection_ids
    if missing_collections:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing collections in order update: {missing_collections}"
        )
    
    # Check 2: Ensure no extra collections are included
    extra_collections = provided_collection_ids - current_collection_ids
    if extra_collections:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid collection IDs provided: {extra_collections}"
        )
    
    # Check 3: Validate collection_order values (no duplicates, sequential starting from 0)
    provided_orders = [order_data.collection_order for order_data in order_update.collection_orders]
    expected_orders = list(range(len(order_update.collection_orders)))
    
    if sorted(provided_orders) != expected_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid collection_order values. Expected sequential values starting from 0, got: {provided_orders}"
        )
    
    # Check 4: Ensure no duplicate collection_order values
    if len(provided_orders) != len(set(provided_orders)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate collection_order values found"
        )
    
    # All validations passed - update the orders
    for collection_order_data in order_update.collection_orders:
        collection_id = collection_order_data.id
        new_order = collection_order_data.collection_order
        
        # Find the collection (we already validated it exists)
        collection = db.query(CollectionModel).filter(
            CollectionModel.id == collection_id,
            CollectionModel.owner_id == current_user.id
        ).first()
        
        if collection:
            collection.collection_order = new_order
            collection.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(current_user)
    
    # Sort collections by collection_order before returning
    sorted_collections = sorted(current_user.collections, key=lambda col: col.collection_order)
    return sorted_collections