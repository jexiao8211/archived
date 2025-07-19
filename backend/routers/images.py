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
    tags=["images"],    # used for API documentation organization in the Swagger UI
    dependencies=[Depends(get_current_user)],
)

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific image from an item."""
    image = verify_item_image(image_id, db, current_user)
    
    # TODO: update this when deploying
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
    db.commit()
    return None