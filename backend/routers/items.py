from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Union
import json
import os
from uuid import uuid4
from datetime import datetime, timezone

from backend.auth.auth_handler import get_current_user
from backend.database import get_db
from backend.models import Item as ItemModel, Collection, Tag as TagModel, ItemImage as ItemImageModel
from backend.models import User
from backend.routers.utils import verify_item
from backend.schemas import Item, ItemCreate, Tag, TagAdd, ItemImage, ItemImageCreate
from backend.config import settings


router = APIRouter(
    prefix="/items",
    tags=["items"]    # used for API documentation organization in the Swagger UI
)


# ---------- item routes ---------- #
# GET       /items/:item_id
# PATCH     /items/:item_id
# DELETE    /items/:item_id                

# ---------- tag routes ---------- #
# GET       /items/:item_id/tags
# POST      /items/:item_id/tags
# DELETE    /item/:item_id/tags

# ---------- image routes ---------- #
# GET       /items/:item_id/images
# POST      /items/:item_id/images/upload
# PATCH      /items/:item_id/images


# ---------- item routes ---------- #
@router.get("/{item_id}", response_model=Item)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific item by ID."""
    item = verify_item(item_id, db, current_user)
    return item

@router.patch("/{item_id}", response_model=Item)
def update_item(
    item_id: int,
    item_update: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a specific item."""
    item = verify_item(item_id, db, current_user)

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
    item = verify_item(item_id, db, current_user)
    
    db.delete(item)
    db.commit()
    return None


# ---------- tag routes ---------- #
@router.get("/{item_id}/tags", response_model=List[Tag])
def get_item_tags(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tags from a specific item."""
    item = verify_item(item_id, db, current_user)
    
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
    item = verify_item(item_id, db, current_user)
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
    item = verify_item(item_id, db, current_user)
    item.update_date=datetime.now(timezone.utc)
    item.tags = []
    db.commit()
    db.refresh(item)
    return item.tags


# ---------- image routes ---------- #
@router.get("/{item_id}/images", response_model=List[ItemImage])
def get_item_images(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all images for an item."""
    item = verify_item(item_id, db, current_user)
    return item.images

# TODO: Remove? Can I just use the update function?
@router.post("/{item_id}/images/upload", response_model=List[ItemImage])
def upload_item_images(
    item_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload images for an item."""
    item = verify_item(item_id, db, current_user)
    item.update_date=datetime.now(timezone.utc)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    for file in files:
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        # Create DB record
        image_url = f"{settings.UPLOAD_URL}/{filename}"
        image = ItemImageModel(image_url=image_url, item_id=item_id)
        db.add(image)

    db.commit()
    db.refresh(item)
    return item.images

@router.patch("/{item_id}/images", response_model=List[ItemImage])
def update_item_images(
    item_id: int,
    deleted_item_images: List[int] = Form(default=[]),
    new_files: List[UploadFile] = File(default=[]),
    new_images_order: List[Union[int, str]] = Form(default=[]), # where index of list is new order and value is itemId (or temp)
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update all images for an item."""
    item = verify_item(item_id, db, current_user)
    
    # Validate file types
    for file in new_files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext} not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
            )

    # Get all current images for this item to validate existing IDs
    current_images = db.query(ItemImageModel).filter(
        ItemImageModel.item_id == item_id
    ).all()
    current_image_ids = [img.id for img in current_images]

    # Validate that all integer IDs in new_images_order belong to this item
    integer_ids_in_order = [id for id in new_images_order if isinstance(id, int)]
    invalid_ids = set(integer_ids_in_order) - set(current_image_ids)
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image IDs in order: {invalid_ids}"
        )

    # 1. Delete images - verify ownership in a single query
    images_to_delete = db.query(ItemImageModel).join(ItemModel).join(Collection).filter(
        ItemImageModel.id.in_(deleted_item_images),
        Collection.owner_id == current_user.id
    ).all()
    
    # Check if all requested images were found and accessible
    found_image_ids = {img.id for img in images_to_delete}
    missing_image_ids = set(deleted_item_images) - found_image_ids
    
    if missing_image_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Images not found or you don't have access to them: {missing_image_ids}"
        )
        
    # Delete physical files and database records
    for image in images_to_delete:
        # TODO: update this when deploying. Right now it is using physical files on my machine
        # Delete the physical file
        try:
            # Extract filename from image_url
            # image_url format: "http://localhost:8000/backend/uploads/filename.ext"
            image_url = image.image_url
            filename = image_url.split('/')[-1]  # Get the filename part
            file_path = os.path.join(settings.UPLOAD_DIR, filename)
            
            # Check if file exists and delete it
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Deleted file: {file_path}")
            else:
                print(f"File not found: {file_path}")
                
        except Exception as e:
            print(f"Error deleting file: {e}")
            # Don't fail the request if file deletion fails
            # The database record will still be deleted
        
        # Delete the database record
        db.delete(image)

    # 2. Upload new images
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_id_map = {}
    for i, file in enumerate(new_files):
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        
        # Create DB record
        image_url = f"{settings.UPLOAD_URL}/{filename}"
        image = ItemImageModel(image_url=image_url, item_id=item_id)
        db.add(image)
        db.flush()  # Get the ID without committing

        temp_id_map[f'new-{i}'] = image.id

    # 3. Update image order
    for order, id in enumerate(new_images_order):
        if isinstance(id, str) and id.startswith("new"):   # id like "new-1"
            new_id = temp_id_map.get(id)
            if not new_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown temp ID: {id}"
                )
            db.query(ItemImageModel).filter_by(id=new_id).update({'image_order': order})
        else:
            # Verify this image still exists and belongs to this item
            id = int(id) if isinstance(id, str) and id.isdigit() else id

            if id not in current_image_ids or id in found_image_ids:
                print(current_image_ids)
                print(found_image_ids)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image ID in order: {id}"
                )
            db.query(ItemImageModel).filter_by(id=id).update({'image_order': order})

    # Update item timestamp
    item.update_date = datetime.now(timezone.utc)
    
    # Single commit for all changes
    db.commit()
    db.refresh(item)
    return item.images

