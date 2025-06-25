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

@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_image(
    item_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific image from an item."""
    item = verify_get_item(item_id, db, current_user)
    
    # Find the image
    image = db.query(ItemImageModel).filter(
        ItemImageModel.id == image_id,
        ItemImageModel.item_id == item_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    db.delete(image)
    db.commit()
    return None