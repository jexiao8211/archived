"""
Database Models for ARCHIVED Application

This module defines all SQLAlchemy database models for the ARCHIVED application.
It includes models for users, collections, items, images, tags, and collection sharing.

The models use SQLAlchemy's declarative base and define relationships between
entities using foreign keys and association tables.

Author: ARCHIVED Team
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime, timezone

# Create a base class for all database models
# Provides core functionality for SQLAlchemy's Object-Relational Mapping (ORM)
# Classes that inherit from this base become database models
Base = declarative_base() 


# Association table for many-to-many relationship between items and tags
# This is a junction table that connects items and tags
# Allows one item to have multiple tags and one tag to be associated with multiple items
item_tags = Table(
    'item_tags',
    Base.metadata,
    Column('item_id', Integer, ForeignKey('items.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class User(Base):
    """
    User model representing application users.
    
    Stores user authentication information and basic profile data.
    Each user can own multiple collections.
    
    Attributes:
        id (int): Primary key, auto-generated user ID
        username (str): Unique username for login and display
        email (str): Unique email address for user identification
        hashed_password (str): Bcrypt hashed password for security
        created_date (datetime): Timestamp when user account was created
        updated_date (datetime): Timestamp when user account was last updated
        collections (List[Collection]): List of collections owned by this user
        
    Note:
        Future enhancements may include:
        - Account activation status
        - Login attempt tracking
        - Password reset functionality
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) 
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to collections owned by this user
    # back_populates creates bidirectional relationship with Collection.owner
    # cascade="all, delete-orphan" ensures collections are deleted when user is deleted
    collections = relationship("Collection", back_populates="owner", cascade="all, delete-orphan") 

class Collection(Base):
    """
    Collection model representing a group of items.
    
    Collections are the main organizational unit in the application.
    Each collection belongs to a user and contains multiple items.
    
    Attributes:
        id (int): Primary key, auto-generated collection ID
        name (str): Display name for the collection
        description (str, optional): Optional description of the collection
        owner_id (int): Foreign key to the user who owns this collection
        collection_order (int): Order position for display purposes (default: 0)
        created_date (datetime): Timestamp when collection was created
        updated_date (datetime): Timestamp when collection was last updated
        owner (User): The user who owns this collection
        items (List[Item]): List of items in this collection
    """
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    collection_order = Column(Integer, default=0)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="collections")
    items = relationship("Item", back_populates="collection")

class Item(Base):
    """
    Item model representing individual items within collections.
    
    Items are the core content units that users organize within collections.
    Each item can have multiple images and tags for categorization.
    
    Attributes:
        id (int): Primary key, auto-generated item ID
        name (str): Display name for the item
        description (str): Description of the item
        collection_id (int): Foreign key to the collection containing this item
        item_order (int): Order position within the collection (default: 0)
        created_date (datetime): Timestamp when item was created
        updated_date (datetime): Timestamp when item was last updated
        collection (Collection): The collection containing this item
        images (List[ItemImage]): List of images associated with this item
        tags (List[Tag]): List of tags associated with this item
    """
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    item_order = Column(Integer, default=0)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    collection = relationship("Collection", back_populates="items")
    images = relationship("ItemImage", back_populates="item")
    # Many-to-many relationship with tags through the item_tags association table
    tags = relationship("Tag", secondary=item_tags, back_populates="items")

class ItemImage(Base):
    """
    ItemImage model representing images associated with items.
    
    Each item can have multiple images, and each image belongs to exactly one item.
    Images are stored as URLs pointing to the actual file locations.
    
    Attributes:
        id (int): Primary key, auto-generated image ID
        image_url (str): URL path to the image file
        item_id (int): Foreign key to the item this image belongs to
        image_order (int): Order position for display purposes (default: 0)
        created_date (datetime): Timestamp when image was uploaded
        updated_date (datetime): Timestamp when image was last updated
        item (Item): The item this image belongs to
        
    Note:
        In production, consider using cloud storage (AWS S3, Google Cloud Storage)
        instead of local file storage for better scalability and reliability.
    """
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String)
    item_id = Column(Integer, ForeignKey("items.id"))
    image_order = Column(Integer, default=0)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship
    item = relationship("Item", back_populates="images")

class Tag(Base):
    """
    Tag model representing categorization labels for items.
    
    Tags provide a flexible way to categorize and search items across collections.
    Each tag can be associated with multiple items, and each item can have multiple tags.
    
    Attributes:
        id (int): Primary key, auto-generated tag ID
        name (str): Unique tag name used for categorization
        items (List[Item]): List of items associated with this tag
    """
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Many-to-many relationship with items through the item_tags association table
    items = relationship("Item", secondary=item_tags, back_populates="tags")


class CollectionShare(Base):
    """
    CollectionShare model for sharing collections with public access.
    
    Allows collection owners to generate shareable links that provide
    public read-only access to their collections without authentication.
    
    Attributes:
        id (int): Primary key, auto-generated share ID
        collection_id (int): Foreign key to the collection being shared (unique)
        token (str): Unique token used in the shareable URL
        is_enabled (bool): Whether the share link is currently active (default: True)
        created_date (datetime): Timestamp when share was created
        updated_date (datetime): Timestamp when share was last updated
        collection (Collection): The collection being shared
    """
    __tablename__ = "collection_shares"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), unique=True)
    token = Column(String, unique=True, index=True)
    is_enabled = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to the shared collection
    collection = relationship("Collection")