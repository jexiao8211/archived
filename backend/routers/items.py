from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
from uuid import uuid4
from datetime import datetime, timezone

from backend.database import get_db
from backend.auth.auth_handler import get_current_user
from backend.models import Item as ItemModel, Collection, Tag as TagModel, ItemImage as ItemImageModel
from backend.schemas import Item, ItemCreate, Tag, TagAdd, ItemImage, ItemImageCreate, ItemImageOrderUpdate
from backend.models import User

UPLOAD_DIR = "backend/uploads"

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
    item.update_date=datetime.now(timezone.utc)

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
    item.update_date=datetime.now(timezone.utc)
    
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
    item.update_date=datetime.now(timezone.utc)
    item.tags = []
    db.commit()
    db.refresh(item)
    return item.tags


@router.get("/{item_id}/images", response_model=List[ItemImage])
def get_item_images(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all images for an item."""
    item = verify_get_item(item_id, db, current_user)
    return item.images

# @router.post("/{item_id}/images", response_model=List[ItemImage]) # TODO: delete this? IDK if its needed anymore
# def add_item_images(
#     item_id: int,
#     image_urls: List[str],
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Add images to an item."""
#     item = verify_get_item(item_id, db, current_user)
#     item.update_date=datetime.now(timezone.utc)
    
#     # Create new images
#     for image_url in image_urls:
#         image = ItemImageModel(image_url=image_url, item_id=item_id)
#         db.add(image)
    
#     db.commit()
#     db.refresh(item)
#     return item.images

@router.post("/{item_id}/images/upload", response_model=List[ItemImage])
def upload_item_images(
    item_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload images for an item."""
    item = verify_get_item(item_id, db, current_user)
    item.update_date=datetime.now(timezone.utc)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    new_images = []
    for file in files:
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        # Create DB record
        # image_url = f"/{UPLOAD_DIR}/{filename}"
        image_url = f"http://localhost:8000/{UPLOAD_DIR}/{filename}"
        image = ItemImageModel(image_url=image_url, item_id=item_id)
        db.add(image)
        new_images.append(image)
    db.commit()
    db.refresh(item)
    return item.images


@router.patch("/{item_id}/images/order", response_model=List[ItemImage])
def update_item_image_order(
    item_id: int,
    order_update: ItemImageOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the order of images for an item."""
    item = verify_get_item(item_id, db, current_user)
    item.updated_date = datetime.now(timezone.utc)
    
    # Update each image's order
    for image_order_data in order_update.image_orders:
        image_id = image_order_data.id
        new_order = image_order_data.image_order
        
        # Find the image and verify it belongs to this item
        image = db.query(ItemImageModel).filter(
            ItemImageModel.id == image_id,
            ItemImageModel.item_id == item_id
        ).first()
        
        if image:
            image.image_order = new_order
            image.updated_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(item)
    
    sorted_images = sorted(item.images, key=lambda img: img.image_order)
    return sorted_images


