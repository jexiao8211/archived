from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime, timezone

# Create a base class for all database models
## Provides core fuinctionality for SQLAlchemy's Object-Relational Maping (ORM)
## Classes the inherit from this base are database models
Base = declarative_base() 


# Association table for item tags
## Define this table differently because its a junction table that connects items and tags
## Allows one item to have multiple tags and one tag to be associate with multiple items
item_tags = Table(
    'item_tags',
    Base.metadata,
    Column('item_id', Integer, ForeignKey('items.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Login attempt tracking
    login_attempts = Column(Integer, default=0)
    last_login_attempt = Column(DateTime(timezone=True), default=func.now())
    
    # Password reset
    password_reset_token = Column(String, nullable=True)
    password_reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    
    # back_populates argument tells sqlalchemy to update 'owner' when 'collections' is updated
    ## does not exist in database - is created by SQLAlchemy when you query the data
    collections = relationship("Collection", back_populates="owner", cascade="all, delete-orphan") 

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="collections")
    items = relationship("Item", back_populates="collection")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    
    collection = relationship("Collection", back_populates="items")
    images = relationship("ItemImage", back_populates="item")

    # secondary argument tells sqlalchemy to use item_tags for the many-to-many relationships
    tags = relationship("Tag", secondary=item_tags, back_populates="items")

class ItemImage(Base):
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String) # TODO: currently use local file system for images, eventually use cloud storage
    item_id = Column(Integer, ForeignKey("items.id"))
    
    item = relationship("Item", back_populates="images")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    items = relationship("Item", secondary=item_tags, back_populates="tags")