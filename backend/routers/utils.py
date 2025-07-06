from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth.auth_handler import get_current_user
from backend.database import get_db
from backend.models import Item as ItemModel, Collection
from backend.models import User


# Dependency injection
def verify_item(
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