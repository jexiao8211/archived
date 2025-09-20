"""
Pydantic Schemas for ARCHIVED Application

This module defines all Pydantic models used for request/response validation
and serialization in the ARCHIVED API. These schemas ensure type safety
and automatic validation of incoming and outgoing data.

The schemas are organized by domain (authentication, users, collections, etc.)
and follow a consistent naming pattern for different use cases.

Author: ARCHIVED Team
"""

from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional, Union
from datetime import datetime


# ----- AUTHENTICATION SCHEMAS ----- #
class Token(BaseModel):
    """
    JWT token response schema.
    
    Returned when a user successfully authenticates or refreshes their token.
    
    Attributes:
        access_token (str): JWT access token for API authentication
        refresh_token (str): JWT refresh token for obtaining new access tokens
        token_type (str): Token type, typically "bearer"
    """
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    """
    Token payload data schema.
    
    Used internally for extracting user information from JWT tokens.
    
    Attributes:
        username (str, optional): Username extracted from token payload
    """
    username: str | None = None


# ----- USER SCHEMAS ----- #
class UserCreate(BaseModel):
    """
    Schema for creating a new user account.
    
    Used during user registration to validate incoming user data.
    
    Attributes:
        username (str): Unique username for the new user
        email (str): Email address for the new user
        password (str): Plain text password (will be hashed before storage)
        
    Note:
        This is the only schema that should ever receive plain text passwords.
        All other schemas use hashed passwords for security.
    """
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    """
    Schema for returning user data to clients.
    
    Contains only safe, public user information that can be safely
    exposed to the frontend. Excludes sensitive data like passwords.
    
    Attributes:
        username (str): User's display username
        email (str, optional): User's email address
        created_date (datetime): When the user account was created
        updated_date (datetime): When the user account was last updated
    """
    username: str
    email: str | None = None
    created_date: datetime
    updated_date: datetime


class UserInDB(UserResponse):
    """
    Schema for internal database operations.
    
    Extends UserResponse to include the hashed password.
    This schema is only used internally and never sent to clients.
    
    Attributes:
        hashed_password (str): Bcrypt hashed password for authentication
    """
    hashed_password: str


class UserUpdate(BaseModel):
    """
    Schema for updating user information.
    
    Used when a user wants to change their username.
    Requires current password for security verification.
    
    Attributes:
        new_username (str): The new username to set
        current_password (str): Current password for verification
        
    Note:
        Future enhancements may include password reset functionality.
    """
    new_username: str
    current_password: str

# ----- COLLECTION SCHEMAS ----- #
class CollectionBase(BaseModel):
    """
    Base schema for collection data.
    
    Contains the common fields shared across collection schemas.
    
    Attributes:
        name (str): Display name for the collection
        description (str, optional): Optional description of the collection
    """
    name: str
    description: Optional[str] = None


class CollectionCreate(CollectionBase):
    """
    Schema for creating a new collection.
    
    Inherits from CollectionBase. Used when a user creates a new collection.
    """
    pass


class Collection(CollectionBase):
    """
    Complete collection schema with all fields.
    
    Used for returning collection data to clients, including all metadata
    and associated items.
    
    Attributes:
        id (int): Unique collection identifier
        owner_id (int): ID of the user who owns this collection
        collection_order (int): Display order position
        created_date (datetime): When the collection was created
        updated_date (datetime): When the collection was last updated
        items (List[Item]): List of items in this collection
    """
    id: int
    owner_id: int
    collection_order: int
    created_date: datetime
    updated_date: datetime
    items: List['Item'] = []  # Forward reference to Item schema
    model_config = ConfigDict(from_attributes=True)


class CollectionOrderItem(BaseModel):
    """
    Schema for a single collection order update.
    
    Used when updating the display order of collections.
    
    Attributes:
        id (int): Collection ID to update
        collection_order (int): New order position for this collection
    """
    id: int
    collection_order: int


class CollectionOrderUpdate(BaseModel):
    """
    Schema for updating collection order.
    
    Contains a list of collection order items to update multiple
    collections' display order in a single request.
    
    Attributes:
        collection_orders (List[CollectionOrderItem]): List of collection order updates
    """
    collection_orders: List[CollectionOrderItem]


# ----- ITEM IMAGE SCHEMAS ----- #
class ItemImageBase(BaseModel):
    """
    Base schema for item image data.
    
    Attributes:
        image_url (str): URL path to the image file
    """
    image_url: str


class ItemImageCreate(ItemImageBase):
    """
    Schema for creating a new item image.
    
    Inherits from ItemImageBase. Used when uploading new images.
    """
    pass


class ItemImage(ItemImageBase):
    """
    Complete item image schema with all fields.
    
    Used for returning image data to clients.
    
    Attributes:
        id (int): Unique image identifier
        item_id (int): ID of the item this image belongs to
        image_order (int): Display order position
        created_date (datetime): When the image was uploaded
        updated_date (datetime): When the image was last updated
    """
    id: int
    item_id: int
    image_order: int
    created_date: datetime
    updated_date: datetime
    model_config = ConfigDict(from_attributes=True)


class ItemImageOrderItem(BaseModel):
    """
    Schema for a single image order update.
    
    Used when updating the display order of images within an item.
    
    Attributes:
        id (int): Image ID to update
        image_order (int): New order position for this image
    """
    id: int
    image_order: int


# ----- TAG SCHEMAS ----- #
class TagBase(BaseModel):
    """
    Base schema for tag data.
    
    Attributes:
        name (str): Tag name used for categorization
    """
    name: str


class TagCreate(TagBase):
    """
    Schema for creating a new tag.
    
    Inherits from TagBase. Used when creating new tags.
    """
    pass


class Tag(TagBase):
    """
    Complete tag schema with all fields.
    
    Used for returning tag data to clients.
    
    Attributes:
        id (int): Unique tag identifier
    """
    id: int
    model_config = ConfigDict(from_attributes=True)


class TagAdd(BaseModel):
    """
    Schema for adding tags to an item.
    
    Used when associating multiple tags with an item.
    
    Attributes:
        tags (List[str]): List of tag names to add to the item
    """
    tags: List[str]


# ----- ITEM SCHEMAS ----- #
class ItemBase(BaseModel):
    """
    Base schema for item data.
    
    Contains the common fields shared across item schemas.
    
    Attributes:
        name (str): Display name for the item
        description (str, optional): Optional description of the item
    """
    name: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    """
    Schema for creating a new item.
    
    Inherits from ItemBase. Used when a user creates a new item.
    """
    pass


class Item(ItemBase):
    """
    Complete item schema with all fields.
    
    Used for returning item data to clients, including all metadata,
    associated images, and tags.
    
    Attributes:
        id (int): Unique item identifier
        collection_id (int): ID of the collection containing this item
        item_order (int): Display order position within the collection
        created_date (datetime): When the item was created
        updated_date (datetime): When the item was last updated
        images (List[ItemImage]): List of images associated with this item
        tags (List[Tag]): List of tags associated with this item
    """
    id: int
    collection_id: int
    item_order: int
    created_date: datetime
    updated_date: datetime
    images: List[ItemImage] = []
    tags: List[Tag] = []
    model_config = ConfigDict(from_attributes=True)


class ItemOrderUpdate(BaseModel):
    """
    Schema for updating item order within a collection.
    
    Used when reordering items within a collection.
    
    Attributes:
        item_ids (List[int]): List of item IDs in the desired order
        
    Raises:
        ValueError: If item IDs are empty, not unique, or not positive integers
    """
    item_ids: List[int] = Field(..., min_length=1, description="List of item IDs in the desired order")
    
    @field_validator('item_ids')
    @classmethod
    def validate_item_ids(cls, v):
        """
        Validate that item IDs are positive integers and unique.
        
        Args:
            v (List[int]): List of item IDs to validate
            
        Returns:
            List[int]: Validated list of item IDs
            
        Raises:
            ValueError: If validation fails
        """
        if not v:
            raise ValueError("Item IDs list cannot be empty")
        
        # Check for duplicates
        if len(v) != len(set(v)):
            raise ValueError("Item IDs must be unique")
        
        # Check that all IDs are positive
        for item_id in v:
            if not isinstance(item_id, int) or item_id <= 0:
                raise ValueError("All item IDs must be positive integers")
        
        return v
        
# Update the Collection model to include items
## ensures forward references are properly resolved after all classes are defined
Collection.model_rebuild()

