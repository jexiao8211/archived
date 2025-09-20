"""
Utility Functions for ARCHIVED Application Routers

This module provides utility functions used across multiple routers including
verification functions, file validation, and image compression. These functions
help maintain consistency and reduce code duplication across the application.

Author: ARCHIVED Team
"""

from fastapi import Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Tuple
import os
import io
from PIL import Image

from backend.auth.auth_handler import get_current_user
from backend.database import get_db
from backend.models import Item as ItemModel, Collection as CollectionModel, ItemImage as ItemImageModel
from backend.models import User
from backend.config import settings


# Dependency injection functions
def verify_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ItemModel:
    """
    Verify that an item exists and belongs to a collection owned by the current user.
    
    This dependency function ensures that users can only access items from their own collections.
    Used as a dependency in item-related endpoints.
    
    Args:
        item_id (int): The ID of the item to verify
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        ItemModel: The verified item
        
    Raises:
        HTTPException: If item not found or user doesn't have access
    """
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
) -> CollectionModel:
    """
    Verify that a collection exists and belongs to the current user.
    
    This dependency function ensures that users can only access their own collections.
    Used as a dependency in collection-related endpoints.
    
    Args:
        collection_id (int): The ID of the collection to verify
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        CollectionModel: The verified collection
        
    Raises:
        HTTPException: If collection not found or user doesn't have access
    """
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
) -> ItemImageModel:
    """
    Verify that an image exists and belongs to an item owned by the current user.
    
    This dependency function ensures that users can only access images from their own items.
    Used as a dependency in image-related endpoints.
    
    Args:
        image_id (int): The ID of the image to verify
        db (Session): Database session
        current_user (User): The authenticated user
        
    Returns:
        ItemImageModel: The verified image
        
    Raises:
        HTTPException: If image not found or user doesn't have access
    """
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

def compress_image(image_data: bytes, filename: str, max_size_bytes: int) -> Tuple[bytes, str]:
    """
    Compress an image to fit within the specified size limit.
    
    Attempts to compress an image by reducing quality and/or dimensions until it
    fits within the specified size limit. Converts images to JPEG format for better compression.
    
    Args:
        image_data (bytes): The original image data
        filename (str): The original filename
        max_size_bytes (int): Maximum allowed file size in bytes
        
    Returns:
        Tuple[bytes, str]: Compressed image data and new filename
        
    Raises:
        HTTPException: If compression fails
    """
    try:
        # Open the image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (for JPEG compression)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create a white background for transparent images
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Start with high quality and reduce until size is acceptable
        quality = 95
        output_format = 'JPEG'
        
        while quality > 10:  # Don't go below 10% quality
            # Create a buffer to store the compressed image
            buffer = io.BytesIO()
            
            # Save with current quality
            image.save(buffer, format=output_format, quality=quality, optimize=True)
            compressed_data = buffer.getvalue()
            
            # Check if size is acceptable
            if len(compressed_data) <= max_size_bytes:
                # Update filename to reflect JPEG format
                name, _ = os.path.splitext(filename)
                new_filename = f"{name}.jpg"
                return compressed_data, new_filename
            
            # Reduce quality and try again
            quality -= 5
        
        # If we still can't fit, try reducing dimensions
        original_size = image.size
        scale_factor = 0.9
        
        while scale_factor > 0.3:  # Don't go below 30% of original size
            new_width = int(original_size[0] * scale_factor)
            new_height = int(original_size[1] * scale_factor)
            resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            resized_image.save(buffer, format=output_format, quality=85, optimize=True)
            compressed_data = buffer.getvalue()
            
            if len(compressed_data) <= max_size_bytes:
                name, _ = os.path.splitext(filename)
                new_filename = f"{name}.jpg"
                return compressed_data, new_filename
            
            scale_factor -= 0.1
        
        # If all else fails, return the smallest version we can make
        buffer = io.BytesIO()
        resized_image.save(buffer, format=output_format, quality=50, optimize=True)
        compressed_data = buffer.getvalue()
        name, _ = os.path.splitext(filename)
        new_filename = f"{name}.jpg"
        return compressed_data, new_filename
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to compress image {filename}: {str(e)}"
        )

def validate_and_compress_files(
    files: List[UploadFile] = File(...)
) -> List[Tuple[UploadFile, bool]]:
    """
    Validate file types and compress images that exceed size limits.
    
    Validates that all files are of allowed types and automatically compresses
    image files that exceed the configured size limit. Non-image files that are
    too large will cause an error.
    
    Args:
        files (List[UploadFile]): List of uploaded files to validate and process
        
    Returns:
        List[Tuple[UploadFile, bool]]: List of tuples containing (processed_file, was_compressed)
        
    Raises:
        HTTPException: If file type is not allowed or non-image file is too large
    """
    processed_files = []
    
    for file in files:
        # Check file extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {ext} not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
            )
        
        # Read file content
        file_content = file.file.read()
        file.file.seek(0)  # Reset file pointer for later use
        
        was_compressed = False
        
        # Check if file needs compression
        if len(file_content) > settings.MAX_FILE_SIZE:
            # Only compress image files
            if ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                try:
                    compressed_data, new_filename = compress_image(
                        file_content, 
                        file.filename, 
                        settings.MAX_FILE_SIZE
                    )
                    
                    # Create a new UploadFile with compressed data
                    compressed_file = UploadFile(
                        filename=new_filename,
                        file=io.BytesIO(compressed_data)
                    )
                    
                    processed_files.append((compressed_file, True))
                    was_compressed = True
                    
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to compress {file.filename}: {str(e)}"
                    )
            else:
                # Non-image files that are too large
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} too large. Maximum size is {settings.MAX_FILE_SIZE // (1024*1024)}MB"
                )
        
        if not was_compressed:
            processed_files.append((file, False))
    
    return processed_files

def validate_files(
    files: List[UploadFile] = File(...)
) -> List[Tuple[UploadFile, bool]]:
    """
    Legacy validation function - now redirects to validate_and_compress_files.
    
    This function is maintained for backward compatibility but now uses the
    enhanced validation and compression functionality.
    
    Args:
        files (List[UploadFile]): List of uploaded files to validate
        
    Returns:
        List[Tuple[UploadFile, bool]]: List of tuples containing (processed_file, was_compressed)
    """
    return validate_and_compress_files(files)