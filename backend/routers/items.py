from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import Item as ItemModel, Collection, Tag as TagModel
from backend.schemas import Item, ItemCreate, Tag, TagAdd
from backend.auth.auth_handler import get_current_user
from backend.models import User


router = APIRouter(
    prefix="/items",
    tags=["items"]    # used for API documentation organization in the Swagger UI
)


# GET       /items/:item_id                      # get a specific item
# PATCH     /items/:item_id                      # update an item
# DELETE    /items/:item_id                      # delete an item

# GET       /items/:item_id/tags
# POST      /items/:item_id/tags
# DELETE    /item/:item_id/tags

# Dependency injection
def verify_get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
     # Get the item and verify it belongs to a collection owned by the current user
    item = db.query(ItemModel).join(Collection).filter(
        ItemModel.id == item_id,
        Collection.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or you don't have access to it"
        )
    
    return item

@router.get("/{item_id}", response_model=Item)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific item by ID."""
    item = verify_get_item(item_id, db, current_user)
    return item

@router.patch("/{item_id}", response_model=Item)
def update_item(
    item_id: int,
    item_update: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific item."""
    item = verify_get_item(item_id, db, current_user)

    # Update item fields
    item.name = item_update.name
    item.description = item_update.description

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific item."""
    item = verify_get_item(item_id, db, current_user)
    
    db.delete(item)
    db.commit()
    return None

@router.get("/{item_id}/tags", response_model=List[Tag])
def get_item_tags(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tags from a specific item."""
    item = verify_get_item(item_id, db, current_user)
    
    # Simply return the tags through the relationship
    return item.tags 

@router.post("/{item_id}/tags", response_model=List[Tag])
def add_item_tags(
    item_id: int,
    tag_data: TagAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add tags to an item."""
    item = verify_get_item(item_id, db, current_user)
    
    # Get or create tags
    for tag_name in tag_data.tags:
        # Try to get existing tag
        tag = db.query(TagModel).filter(TagModel.name == tag_name).first()
        if not tag:
            # Create new tag if it doesn't exist
            tag = TagModel(name=tag_name)
            db.add(tag)
            db.flush()  # Flush to get the tag ID before committing the transaction
        
        # Add tag to item if it's not already there
        if tag not in item.tags:
            item.tags.append(tag)
    
    db.commit()
    db.refresh(item)
    return item.tags

@router.delete("/{item_id}/tags", response_model=List[Tag])
def delete_item_tags(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove all tags from an item."""
    item = verify_get_item(item_id, db, current_user)
    item.tags = []
    db.commit()
    db.refresh(item)
    return item.tags
