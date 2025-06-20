from pydantic import BaseModel, ConfigDict
from typing import List, Optional


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
    items: List['Item'] = []    # in quotation marks because its a forward reference
    model_config = ConfigDict(from_attributes=True)  # Allows pydantic to create models from SQLAlchemy objects

# ----- ITEM IMAGE ----- #
class ItemImageBase(BaseModel):
    image_url: str

class ItemImageCreate(ItemImageBase):
    pass

class ItemImage(ItemImageBase):
    id: int
    item_id: int
    model_config = ConfigDict(from_attributes=True)


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
    description: str

class ItemCreate(ItemBase):
    collection_id: int

class Item(ItemBase):
    id: int
    collection_id: int
    images: List[ItemImage] = []
    tags: List[Tag] = []
    model_config = ConfigDict(from_attributes=True)


# Update the Collection model to include items
## ensures forward references are properly resolved after all classes are defined
Collection.model_rebuild()

