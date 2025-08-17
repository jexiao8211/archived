from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import uuid4

from backend.database import get_db
from backend.models import Collection as CollectionModel, CollectionShare as CollectionShareModel, Item as ItemModel
from backend.schemas import Collection, Item
from backend.auth.auth_handler import get_current_user
from backend.models import User
from backend.config import settings


router = APIRouter(
    prefix="/share",
    tags=["share"],
)


@router.get("/{token}", response_model=Collection)
def get_shared_collection(
    token: str,
    db: Session = Depends(get_db)
):
    """Public endpoint. Get a collection by share token."""
    share = db.query(CollectionShareModel).filter(
        CollectionShareModel.token == token,
        CollectionShareModel.is_enabled == True
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or disabled share link"
        )

    collection = db.query(CollectionModel).filter(
        CollectionModel.id == share.collection_id
    ).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )

    # Ensure stable item ordering in response
    collection.items.sort(key=lambda item: item.item_order)
    return collection


@router.post("/collections/{collection_id}")
def create_or_enable_share(
    collection_id: int,
    rotate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or enable a share link for a collection. Requires ownership.

    - If a share exists and rotate=true, create a new token.
    - If a share exists and rotate=false, re-enable and return existing token.
    - If no share exists, create one.
    """
    collection = db.query(CollectionModel).filter(
        CollectionModel.id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found or you don't have access to it"
        )

    share = db.query(CollectionShareModel).filter(
        CollectionShareModel.collection_id == collection_id
    ).first()

    if share and rotate:
        share.token = uuid4().hex
        share.is_enabled = True
    elif share:
        share.is_enabled = True
    else:
        share = CollectionShareModel(
            collection_id=collection_id,
            token=uuid4().hex,
            is_enabled=True
        )
        db.add(share)

    db.commit()
    db.refresh(share)

    share_url = f"{settings.FRONTEND_URL}/share/{share.token}" if hasattr(settings, 'FRONTEND_URL') else f"/share/{share.token}"
    return {"token": share.token, "url": share_url, "is_enabled": share.is_enabled}


@router.delete("/collections/{collection_id}")
def disable_share(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Disable an existing share link. Requires ownership."""
    share = db.query(CollectionShareModel).join(CollectionModel).filter(
        CollectionShareModel.collection_id == collection_id,
        CollectionModel.owner_id == current_user.id
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found"
        )

    share.is_enabled = False
    db.commit()

    return {"status": "disabled"}


@router.get("/{token}/items/{item_id}", response_model=Item)
def get_shared_item(
    token: str,
    item_id: int,
    db: Session = Depends(get_db)
):
    """Public endpoint. Get a specific item by share token ensuring it belongs to the shared collection."""
    share = db.query(CollectionShareModel).filter(
        CollectionShareModel.token == token,
        CollectionShareModel.is_enabled == True
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or disabled share link"
        )

    item = db.query(ItemModel).filter(
        ItemModel.id == item_id,
        ItemModel.collection_id == share.collection_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in shared collection"
        )

    return item

