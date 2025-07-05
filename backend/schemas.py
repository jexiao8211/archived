from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


# ----- AUTHENTICATION ----- #
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


# ----- USER ----- #
class UserCreate(BaseModel): 
    username: str
    email: str
    password: str   # This is the only schema that should ever see the plain password

# For sending data back to client: only safe public data
class UserResponse(BaseModel): 
    username: str
    email: str | None = None
    created_date: datetime
    updated_date: datetime

# For database operations: contains public data and hashed password. Only used internally
class UserInDB(UserResponse):
    hashed_password: str

class UserUpdate(BaseModel):
    new_username: str
    current_password: str

# TODO: implement some "forgot my password" functionality

# ----- COLLECTIONS ----- #
class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionCreate(CollectionBase):
    pass

class Collection(CollectionBase):
    id: int
    owner_id: int
    collection_order: int
    created_date: datetime
    updated_date: datetime
    items: List['Item'] = []    # in quotation marks because its a forward reference
    model_config = ConfigDict(from_attributes=True)  # Allows pydantic to create models from SQLAlchemy objects

class CollectionOrderItem(BaseModel):
    id: int
    collection_order: int

class CollectionOrderUpdate(BaseModel):
    collection_orders: List[CollectionOrderItem]


# ----- ITEM IMAGE ----- #
class ItemImageBase(BaseModel):
    image_url: str

class ItemImageCreate(ItemImageBase):
    pass

class ItemImage(ItemImageBase):
    id: int
    item_id: int
    image_order: int
    created_date: datetime
    updated_date: datetime
    model_config = ConfigDict(from_attributes=True)

class ItemImageOrderItem(BaseModel):
    id: int
    image_order: int

class ItemImageOrderUpdate(BaseModel):
    image_orders: List[ItemImageOrderItem]


# ----- TAG ----- #
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class TagAdd(BaseModel):
    tags: List[str]  # List of tag names to add


# ----- ITEM ----- #
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    collection_id: int
    item_order: int
    created_date: datetime
    updated_date: datetime
    images: List[ItemImage] = []
    tags: List[Tag] = []
    model_config = ConfigDict(from_attributes=True)

class ItemOrderItem(BaseModel):
    id: int
    item_order: int

class ItemOrderUpdate(BaseModel):
    item_orders: List[ItemOrderItem]

# Update the Collection model to include items
## ensures forward references are properly resolved after all classes are defined
Collection.model_rebuild()

