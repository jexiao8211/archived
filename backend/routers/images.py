"""
Image Management Router for ARCHIVED Application

This module handles direct image operations including individual image deletion.
Provides endpoints for managing images independently of their parent items.

All endpoints require authentication and verify image ownership through item ownership.

Author: ARCHIVED Team
"""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.auth_handler import get_current_user
from backend.models import Item as ItemModel, Collection, ItemImage as ItemImageModel
from backend.models import User
from backend.config import settings
from backend.routers.utils import verify_item_image

router = APIRouter(
    prefix="/images",
    tags=["images"],
    dependencies=[Depends(get_current_user)],
)

# API Endpoints:
# DELETE    /images/{image_id}              # Delete a specific image

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Delete a specific image from an item.
    
    Permanently deletes an image both from the database and from disk storage.
    Only the owner of the collection containing the item can delete its images.
    
    Args:
        image_id (int): The ID of the image to delete
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        None: No content returned on successful deletion
        
    Raises:
        HTTPException: If image not found or user doesn't have access
        
    Note:
        This action is irreversible. The image file will be permanently deleted from disk.
    """
    image = verify_item_image(image_id, db, current_user)
    
    # Delete the physical file from disk
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
    db.commit()
    return None