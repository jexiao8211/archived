"""
Item Management Router for ARCHIVED Application

This module handles item-specific operations including CRUD operations on items,
tag management, and image upload/management. Provides endpoints for retrieving,
updating, and deleting items, as well as managing tags and images associated
with those items.

All endpoints require authentication and verify item ownership through collection ownership.

Author: ARCHIVED Team
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Union
import os
from uuid import uuid4
from datetime import datetime, timezone

from backend.auth.auth_handler import get_current_user
from backend.database import get_db
from backend.models import Item as ItemModel, Collection, Tag as TagModel, ItemImage as ItemImageModel
from backend.models import User
from backend.routers.utils import verify_item, validate_and_compress_files
from backend.schemas import Item, ItemCreate, Tag, TagAdd, ItemImage
from backend.config import settings


router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(get_current_user)],
)

# API Endpoints:
# ---------- Item Routes ---------- #
# GET       /items/{item_id}              # Get a specific item
# PATCH     /items/{item_id}              # Update an item
# DELETE    /items/{item_id}              # Delete an item

# ---------- Item Tag Routes ---------- #
# GET       /items/{item_id}/tags         # Get all tags for an item
# POST      /items/{item_id}/tags         # Add tags to an item
# DELETE    /items/{item_id}/tags         # Remove all tags from an item

# ---------- Item Image Routes ---------- #
# GET       /items/{item_id}/images       # Get all images for an item
# POST      /items/{item_id}/images/upload # Upload images to an item
# PATCH     /items/{item_id}/images       # Update images for an item (upload, delete, reorder)


# ---------- Item Routes ---------- #
@router.get("/{item_id}", response_model=Item)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Item:
    """
    Get a specific item by ID.
    
    Retrieves an item with all its associated images and tags.
    Only the owner of the collection containing the item can access it.
    
    Args:
        item_id (int): The ID of the item to retrieve
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        Item: The item with all its images and tags
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = verify_item(item_id, db, current_user)
    return item

@router.patch("/{item_id}", response_model=Item)
def update_item(
    item_id: int,
    item_update: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Item:
    """
    Update a specific item.
    
    Updates the item's name and description. Only the owner of the
    collection containing the item can update it.
    
    Args:
        item_id (int): The ID of the item to update
        item_update (ItemCreate): Updated item data (name and description)
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        Item: The updated item with all its images and tags
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = verify_item(item_id, db, current_user)

    # Update item fields
    item.name = item_update.name
    item.description = item_update.description
    item.updated_date = datetime.now(timezone.utc)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete a specific item.
    
    Permanently deletes the item and all its associated images.
    Only the owner of the collection containing the item can delete it.
    
    Args:
        item_id (int): The ID of the item to delete
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        None: No content returned on successful deletion
        
    Raises:
        HTTPException: If item not found or user doesn't have access
        
    Note:
        This action is irreversible. All item data and images will be permanently deleted.
    """
    item = verify_item(item_id, db, current_user)
    
    db.delete(item)
    db.commit()
    return None


# ---------- Item Tag Routes ---------- #
@router.get("/{item_id}/tags", response_model=List[Tag])
def get_item_tags(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Tag]:
    """
    Get all tags from a specific item.
    
    Retrieves all tags associated with the item. Only the owner of the
    collection containing the item can access its tags.
    
    Args:
        item_id (int): The ID of the item
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Tag]: List of tags associated with the item
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = verify_item(item_id, db, current_user)
    
    # Return the tags through the relationship
    return item.tags 

@router.post("/{item_id}/tags", response_model=List[Tag])
def add_item_tags(
    item_id: int,
    tag_data: TagAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Tag]:
    """
    Add tags to an item.
    
    Adds one or more tags to the item. If a tag doesn't exist, it will be created.
    Duplicate tags are automatically ignored. Only the owner of the collection
    containing the item can add tags to it.
    
    Args:
        item_id (int): The ID of the item to add tags to
        tag_data (TagAdd): Contains list of tag names to add
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Tag]: Updated list of all tags associated with the item
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = verify_item(item_id, db, current_user)
    item.updated_date = datetime.now(timezone.utc)
    
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
) -> List[Tag]:
    """
    Remove all tags from an item.
    
    Removes all tags associated with the item. The tags themselves are not
    deleted from the system, only the associations with this item.
    Only the owner of the collection containing the item can remove its tags.
    
    Args:
        item_id (int): The ID of the item to remove tags from
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[Tag]: Empty list (all tags removed)
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = verify_item(item_id, db, current_user)
    item.updated_date = datetime.now(timezone.utc)
    item.tags = []
    db.commit()
    db.refresh(item)
    return item.tags


# ---------- Item Image Routes ---------- #
@router.get("/{item_id}/images", response_model=List[ItemImage])
def get_item_images(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ItemImage]:
    """
    Get all images for an item.
    
    Retrieves all images associated with the item, including their metadata.
    Only the owner of the collection containing the item can access its images.
    
    Args:
        item_id (int): The ID of the item
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[ItemImage]: List of images associated with the item
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = verify_item(item_id, db, current_user)
    return item.images

@router.post("/{item_id}/images/upload", response_model=List[ItemImage])
def upload_item_images(
    item_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ItemImage]:
    """
    Upload images for an item.
    
    Uploads one or more image files to an item. Files are automatically validated,
    compressed if necessary, and stored with unique filenames. Only the owner of
    the collection containing the item can upload images to it.
    
    Args:
        item_id (int): The ID of the item to upload images to
        files (List[UploadFile]): List of image files to upload
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[ItemImage]: List of all images associated with the item
        
    Raises:
        HTTPException: If item not found, user doesn't have access, or file validation fails
        
    Note:
        Files are automatically compressed if they exceed the size limit.
        Supported formats: JPG, JPEG, PNG, GIF, WEBP
    """
    item = verify_item(item_id, db, current_user)

    # Validate and compress files if needed
    processed_files = validate_and_compress_files(files)

    # Update item timestamp
    item.updated_date = datetime.now(timezone.utc)

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    for file, was_compressed in processed_files:
        # Generate a unique filename
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        
        # Create database record
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
) -> List[ItemImage]:
    """
    Update all images for an item.
    
    Performs a comprehensive update of item images including:
    - Deleting specified images (both database records and physical files)
    - Uploading new images
    - Reordering all images based on the provided order list
    
    This endpoint allows for complex image management operations in a single request.
    Only the owner of the collection containing the item can update its images.
    
    Args:
        item_id (int): The ID of the item to update images for
        deleted_item_images (List[int]): IDs of images to delete
        new_files (List[UploadFile]): New image files to upload
        new_images_order (List[Union[int, str]]): New order for all images (existing IDs and temp IDs for new files)
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        List[ItemImage]: Updated list of all images for the item in new order
        
    Raises:
        HTTPException: If item not found, user doesn't have access, or validation fails
        
    Note:
        - New files are assigned temporary IDs (e.g., "new-0", "new-1") in the order list
        - Physical files are deleted from disk when images are removed
        - Files are automatically compressed if they exceed size limits
    """
    item = verify_item(item_id, db, current_user)
    
    # Validate and compress files if needed
    processed_files = validate_and_compress_files(new_files)

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
    for i, (file, was_compressed) in enumerate(processed_files):
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
    item.updated_date = datetime.now(timezone.utc)
    
    # Single commit for all changes
    db.commit()
    db.refresh(item)
    return item.images

