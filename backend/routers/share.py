"""
Collection Sharing Router for ARCHIVED Application

This module handles public collection sharing functionality. Provides endpoints
for creating shareable links, accessing shared collections, and managing share
settings. Allows collection owners to share their collections publicly without
requiring authentication.

Includes both authenticated endpoints (for creating/managing shares) and
public endpoints (for accessing shared content).

Author: ARCHIVED Team
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import uuid4

from backend.database import get_db
from backend.models import Collection as CollectionModel, CollectionShare as CollectionShareModel, Item as ItemModel
from backend.schemas import Collection, Item
from backend.auth.auth_handler import get_current_user
from backend.models import User
from backend.config import settings


router = APIRouter(
    prefix="/share",
    tags=["share"],
)

# API Endpoints:
# GET     /share/{token}                    # Get shared collection (public)
# GET     /share/{token}/items/{item_id}    # Get shared item (public)
# POST    /share/collections/{collection_id} # Create/enable share link (authenticated)
# DELETE  /share/collections/{collection_id} # Disable share link (authenticated)


@router.get("/{token}", response_model=Collection)
def get_shared_collection(
    token: str,
    db: Session = Depends(get_db)
) -> Collection:
    """
    Get a collection by share token (public endpoint).
    
    Allows public access to a shared collection using a share token.
    No authentication required. Returns the collection with all its items.
    
    Args:
        token (str): The share token for the collection
        db (Session): Database session
        
    Returns:
        Collection: The shared collection with all its items
        
    Raises:
        HTTPException: If token is invalid, disabled, or collection not found
    """
    share = db.query(CollectionShareModel).filter(
        CollectionShareModel.token == token,
        CollectionShareModel.is_enabled == True
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or disabled share link"
        )

    collection = db.query(CollectionModel).filter(
        CollectionModel.id == share.collection_id
    ).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )

    # Ensure stable item ordering in response
    collection.items.sort(key=lambda item: item.item_order)
    return collection


@router.post("/collections/{collection_id}")
def create_or_enable_share(
    collection_id: int,
    rotate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Create or enable a share link for a collection.
    
    Creates a new share link or enables an existing one for a collection.
    Only the collection owner can create or manage share links.
    
    Args:
        collection_id (int): The ID of the collection to share
        rotate (bool, optional): If True and share exists, generate new token. Defaults to False.
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        dict: Share information including token, URL, and enabled status
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
        
    Behavior:
        - If no share exists: creates a new share link
        - If share exists and rotate=True: generates a new token
        - If share exists and rotate=False: re-enables existing share
    """
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )

    share = db.query(CollectionShareModel).filter(
        CollectionShareModel.collection_id == collection_id
    ).first()

    if share and rotate:
        share.token = uuid4().hex
        share.is_enabled = True
    elif share:
        share.is_enabled = True
    else:
        share = CollectionShareModel(
            collection_id=collection_id,
            token=uuid4().hex,
            is_enabled=True
        )
        db.add(share)

    db.commit()
    db.refresh(share)

    share_url = f"{settings.FRONTEND_URL}/share/{share.token}" if hasattr(settings, 'FRONTEND_URL') else f"/share/{share.token}"
    return {"token": share.token, "url": share_url, "is_enabled": share.is_enabled}


@router.delete("/collections/{collection_id}")
def disable_share(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Disable an existing share link.
    
    Disables a share link for a collection, making it no longer publicly accessible.
    The share link is not deleted, just disabled, so it can be re-enabled later.
    Only the collection owner can disable share links.
    
    Args:
        collection_id (int): The ID of the collection
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        dict: Status confirmation
        
    Raises:
        HTTPException: If share link not found or user doesn't have access
    """
    share = db.query(CollectionShareModel).join(CollectionModel).filter(
        CollectionShareModel.collection_id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found"
        )

    share.is_enabled = False
    db.commit()

    return {"status": "disabled"}


@router.get("/{token}/items/{item_id}", response_model=Item)
def get_shared_item(
    token: str,
    item_id: int,
    db: Session = Depends(get_db)
) -> Item:
    """
    Get a specific item from a shared collection (public endpoint).
    
    Allows public access to a specific item within a shared collection.
    Verifies that the item belongs to the collection associated with the share token.
    No authentication required.
    
    Args:
        token (str): The share token for the collection
        item_id (int): The ID of the item to retrieve
        db (Session): Database session
        
    Returns:
        Item: The item with all its images and tags
        
    Raises:
        HTTPException: If token is invalid, disabled, or item not found in shared collection
    """
    share = db.query(CollectionShareModel).filter(
        CollectionShareModel.token == token,
        CollectionShareModel.is_enabled == True
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or disabled share link"
        )

    item = db.query(ItemModel).filter(
        ItemModel.id == item_id,
        ItemModel.collection_id == share.collection_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in shared collection"
        )

    return item

