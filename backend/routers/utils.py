from fastapi import Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os

from backend.auth.auth_handler import get_current_user
from backend.database import get_db
from backend.models import Item as ItemModel, Collection as CollectionModel, ItemImage as ItemImageModel
from backend.models import User
from backend.config import settings


# Dependency injection
def verify_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
     # Get the item and verify it belongs to a collection owned by the current user
    item = db.query(ItemModel).join(CollectionModel).filter(
        ItemModel.id == item_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or you don't have access to it"
        )
    
    return item

def verify_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the collection belongs to the current user and return it
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

def verify_item_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find the image
    image = db.query(ItemImageModel).filter(ItemImageModel.id == image_id).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Verify the user owns the item this image belongs to
    item = db.query(ItemModel).join(CollectionModel).filter(
        ItemModel.id == image.item_id,
        CollectionModel.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or you don't have access to it"
        )

    return image 

def validate_files(
    files: List[UploadFile] = File(...)
):
    # Validate file types and sizes
    for file in files:
        # Check file extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext} not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
            )
        
        # Check file size
        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} too large. Maximum size is {settings.MAX_FILE_SIZE // (1024*1024)}MB"
            )   