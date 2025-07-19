from sqlalchemy.orm import Session

from backend.models import Tag as TagModel

def cleanup_unused_tags(db: Session) -> int:
    """Remove all tags that are not associated with any items.
    
    Args:
        db: Database session 
        
    Returns:
        int: Number of tags that were removed
    """
    unused_tags = db.query(TagModel).filter(~TagModel.items.any()).all()
    count = len(unused_tags)
    for tag in unused_tags:
        db.delete(tag)
    db.commit()
    return count 