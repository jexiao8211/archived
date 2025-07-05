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

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


# GET    /collections/:collection_id          # get a specific collection
# PATCH  /collections/:collection_id          # update a collection
# DELETE /collections/:collection_id          # delete a collection

# GET    /collections/:collection_id/items    # list items in a collection
# POST   /collections/:collection_id/items    # add a new item to the collection


@router.get("/{collection_id}", response_model=Collection)
def get_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific collection by ID."""
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
):
    """Update a specific collection."""
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )
    
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
):
    """Delete a specific collection."""
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )
    
    db.delete(collection)
    db.commit()
    return None 


@router.get("/{collection_id}/items", response_model=List[Item])
def get_collection_items(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all items from a specific collection."""
    # Verify that the collection exists and belongs to the current user
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )
    
    # Return all items in the collection
    return collection.items

@router.post("/{collection_id}/items", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(
    collection_id: int,
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new item in a collection."""
    # Verify that the collection exists and belongs to the current user
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )
    
    
    max_order = db.query(func.max(ItemModel.item_order)).filter(
        ItemModel.collection_id == collection_id
    ).scalar()
    next_order = (max_order or 0) + 1

    # Create the item
    item = ItemModel(
        name=item.name,
        description=item.description,
        collection_id=collection_id,
        item_order=next_order,
        created_date=datetime.now(timezone.utc),
        updated_date=datetime.now(timezone.utc)
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.patch("/{collection_id}/items/order", response_model=List[Item])
def update_item_order(
    collection_id: int,
    order_update: ItemOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the order of items for a collection."""
   # Verify that the collection exists and belongs to the current user
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )
        
    # Update each item's order
    for item_order_data in order_update.item_orders:
        item_id = item_order_data.id
        new_order = item_order_data.item_order
        
        # Find the item and verify it belongs to this collection
        item = db.query(ItemModel).filter(
            ItemModel.id == item_id,
            ItemModel.collection_id == collection_id
        ).first()
        
        if item:
            item.item_order = new_order
            item.updated_date = datetime.now(timezone.utc)

    collection.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(collection)
    
    sorted_items = sorted(collection.items, key=lambda item: item.item_order)
    return sorted_items
