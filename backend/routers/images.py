import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.auth_handler import get_current_user
from backend.models import Item as ItemModel, Collection, ItemImage as ItemImageModel
from backend.models import User

router = APIRouter(
    prefix="/images",
    tags=["images"]    # used for API documentation organization in the Swagger UI
)

UPLOAD_DIR = "backend/uploads"

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

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific image from an item."""
    # Find the image
    image = db.query(ItemImageModel).filter(ItemImageModel.id == image_id).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Verify the user owns the item this image belongs to
    item = db.query(ItemModel).join(Collection).filter(
        ItemModel.id == image.item_id,
        Collection.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found or you don't have access to it"
        )
    
    # TODO: update this when deploying
    # Delete the physical file
    try:
        # Extract filename from image_url
        # image_url format: "http://localhost:8000/backend/uploads/filename.ext"
        image_url = image.image_url
        filename = image_url.split('/')[-1]  # Get the filename part
        file_path = os.path.join(UPLOAD_DIR, filename)
        
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