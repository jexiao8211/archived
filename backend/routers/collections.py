"""
Collection Management Router for ARCHIVED Application

This module handles collection-specific operations including CRUD operations
on collections and item management within collections. Provides endpoints
for retrieving, updating, and deleting collections, as well as managing
items within those collections.

All endpoints require authentication and verify collection ownership.

Author: ARCHIVED Team
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from backend.database import get_db
from backend.models import Collection as CollectionModel, Item as ItemModel, Tag as TagModel
from backend.schemas import Collection, CollectionCreate, Item, ItemCreate, ItemOrderUpdate
from backend.auth.auth_handler import get_current_user
from backend.models import User
from backend.routers.utils import verify_collection

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)

# API Endpoints:
# ---------- Collection Routes ---------- #
# GET    /collections/{collection_id}          # Get a specific collection
# PATCH  /collections/{collection_id}          # Update a collection
# DELETE /collections/{collection_id}          # Delete a collection

# ---------- Collection Item Routes ---------- #
# GET    /collections/{collection_id}/items    # List items in a collection
# POST   /collections/{collection_id}/items    # Add a new item to the collection
# PATCH  /collections/{collection_id}/items/order # Change the order of items in the collection



# ---------- Collection Routes ---------- #
@router.get("/{collection_id}", response_model=Collection)
def get_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Collection:
    """
    Get a specific collection by ID.
    
    Retrieves a collection and all its associated items. Only the collection
    owner can access their collections.
    
    Args:
        collection_id (int): The ID of the collection to retrieve
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        Collection: The collection with all its items
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
    """
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )
    return collection

@router.patch("/{collection_id}", response_model=Collection)
def update_collection(
    collection_id: int,
    collection_update: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Collection:
    """
    Update a specific collection.
    
    Updates the collection's name and description. Only the collection
    owner can update their collections.
    
    Args:
        collection_id (int): The ID of the collection to update
        collection_update (CollectionCreate): Updated collection data
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        Collection: The updated collection
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
    """
    collection = verify_collection(collection_id, db, current_user)
    
    # Update collection fields
    collection.name = collection_update.name
    collection.description = collection_update.description
    collection.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(collection)
    return collection

@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete a specific collection.
    
    Permanently deletes the collection and all its associated items and images.
    Only the collection owner can delete their collections.
    
    Args:
        collection_id (int): The ID of the collection to delete
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        None: No content returned on successful deletion
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
        
    Note:
        This action is irreversible. All collection data will be permanently deleted.
    """
    collection = verify_collection(collection_id, db, current_user)

    db.delete(collection)
    db.commit()
    return None 


# ---------- Collection Item Routes ---------- #
@router.get("/{collection_id}/items", response_model=List[Item])
def get_collection_items(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Item]:
    """
    Get all items from a specific collection.
    
    Retrieves all items in the collection, including their images and tags.
    Items are returned sorted by their display order.
    
    Args:
        collection_id (int): The ID of the collection
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Item]: List of items in the collection, sorted by order
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
    """
    collection = verify_collection(collection_id, db, current_user)
    
    # Return all items in the collection sorted by item_order
    sorted_items = sorted(collection.items, key=lambda item: item.item_order)
    return sorted_items

@router.post("/{collection_id}/items", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(
    collection_id: int,
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Item:
    """
    Create a new item in a collection.
    
    Creates a new item with the provided name and description. The item
    is automatically assigned the next available order position within the collection.
    
    Args:
        collection_id (int): The ID of the collection to add the item to
        item (ItemCreate): Item data (name and description)
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        Item: The created item with all metadata
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
    """
    collection = verify_collection(collection_id, db, current_user)

    # Get the next available order position for items in this collection
    max_order = db.query(func.max(ItemModel.item_order)).filter(
        ItemModel.collection_id == collection_id
    ).scalar()
    next_order = (max_order or 0) + 1

    # Create the new item
    new_item = ItemModel(
        name=item.name,
        description=item.description,
        collection_id=collection_id,
        item_order=next_order,
        created_date=datetime.now(timezone.utc),
        updated_date=datetime.now(timezone.utc)
    )
    
    # Update collection timestamp
    collection.updated_date = datetime.now(timezone.utc)

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.patch("/{collection_id}/items/order", response_model=List[Item])
def update_item_order(
    collection_id: int,
    order_update: ItemOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Item]:
    """
    Update the display order of items within a collection.
    
    Reorders the items in the collection based on the provided list of item IDs.
    The order in the list determines the new display order (0-based indexing).
    
    Args:
        collection_id (int): The ID of the collection
        order_update (ItemOrderUpdate): Contains list of item IDs in desired order
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Item]: Updated items in new order
        
    Raises:
        HTTPException: If collection not found, user doesn't have access, or item IDs don't match
    """
    collection = verify_collection(collection_id, db, current_user)
    
    # Get all current items for this collection
    current_items = db.query(ItemModel).filter(
        ItemModel.collection_id == collection_id
    ).all()
    current_item_ids = {item.id for item in current_items}
    
    # Validate that all provided item IDs exist in the collection
    if set(current_item_ids) != set(order_update.item_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item IDs in order update must match exactly with current collection items"
        )
    
    # Update item orders based on their position in the list
    for order, item_id in enumerate(order_update.item_ids):
        item = db.query(ItemModel).filter(
            ItemModel.id == item_id,
            ItemModel.collection_id == collection_id
        ).first()
        
        if item:
            item.item_order = order
            item.updated_date = datetime.now(timezone.utc)

    # Update collection timestamp
    collection.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(collection)
    
    # Return items sorted by their new order
    sorted_items = sorted(collection.items, key=lambda item: item.item_order)
    return sorted_items
