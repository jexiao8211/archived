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

# ---------- current user routes ---------- #
# GET       /users/me                   # Get current user's information
# PATCH     /users/me                   # Update user's username
# DELETE    /users/me                   # Delete user

# ---------- collection routes ---------- #
# GET       /users/me/collections       # list collections for a user
# POST      /users/me/collections       # create a collection for a user
# PATCH   /users/me/collections/order    # change the order of all collections of the user



# ---------- current user routes ---------- #
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


# ---------- collection routes ---------- #
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
    order_update: List[int],
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
    if len(order_update)==0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No collection orders provided"
        )
    
    # Check: Ensure all current items align with order_update
    if set(current_collection_ids) != set(order_update):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item IDs in order update must match exactly with current collections"
        )
    
    # All validations passed - update the orders
    for order, id in enumerate(order_update):  
        # Find the collection (we already validated it exists)
        collection = db.query(CollectionModel).filter(
            CollectionModel.id == id,
            CollectionModel.owner_id == current_user.id
        ).first()
        
        if collection:
            collection.collection_order = order
            collection.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(current_user)
    
    # Sort collections by collection_order before returning
    sorted_collections = sorted(current_user.collections, key=lambda col: col.collection_order)
    return sorted_collections