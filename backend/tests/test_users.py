import pytest
from fastapi import status

def test_get_current_user(authorized_client, test_user):
    """Test getting current user information."""
    response = authorized_client.get('/users/me')
    assert response.status_code == 200
    
    user = response.json()
    assert user['username'] == test_user.username
    assert user['email'] == test_user.email

def test_get_current_user_unauthorized(client):
    """Test getting current user information without authentication."""
    response = client.get('/users/me')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_user_collections(authorized_client, test_user, test_collection):
    """Test getting all collections for the current user."""
    response = authorized_client.get('/users/me/collections')
    assert response.status_code == 200
    
    collections = response.json()
    assert len(collections) == 1  # Only the test collection
    collection = collections[0]
    assert collection['name'] == test_collection.name
    assert collection['description'] == test_collection.description
    assert collection['owner_id'] == test_user.id
    assert len(collection['items']) == 3  # From fixture

def test_get_user_collections_unauthorized(client):
    """Test getting collections without authentication."""
    response = client.get('/users/me/collections')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_collection(authorized_client, test_user):
    """Test creating a new collection for the current user."""
    collection_data = {
        "name": "newcollection",
        "description": "a new collection"
    }
    
    response = authorized_client.post(
        '/users/me/collections',
        json=collection_data
    )
    assert response.status_code == status.HTTP_201_CREATED
    
    collection = response.json()
    assert collection['name'] == collection_data['name']
    assert collection['description'] == collection_data['description']
    assert collection['owner_id'] == test_user.id
    assert len(collection['items']) == 0  # New collection has no items

def test_create_collection_unauthorized(client):
    """Test creating a collection without authentication."""
    collection_data = {
        "name": "newcollection",
        "description": "a new collection"
    }
    
    response = client.post(
        '/users/me/collections',
        json=collection_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_collection_missing_name(authorized_client):
    """Test creating a collection without a name."""
    collection_data = {
        "description": "a new collection"
    }
    
    response = authorized_client.post(
        '/users/me/collections',
        json=collection_data
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY