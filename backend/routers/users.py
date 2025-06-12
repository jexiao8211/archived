from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import User, Collection as CollectionModel
from backend.schemas import UserResponse, Collection, CollectionCreate
from backend.auth.auth_handler import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


# GET    /users/me     # get current user's information

# GET    /users/me/collections          # list collections for a user
# POST   /users/me/collections          # create a collection for a user


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get information about the currently logged-in user."""
    return current_user

@router.get("/me/collections", response_model=List[Collection])
def get_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all collections for the current user."""
    return current_user.collections

@router.post("/me/collections", response_model=Collection)
def create_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new collection for the current user."""
    collection = CollectionModel(
        name=collection.name,
        description=collection.description,
        owner_id=current_user.id
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection