import pytest
from fastapi import status

def test_get_collection(authorized_client, test_collection):
    response = authorized_client.get(f'/collections/{test_collection.id}')
    assert response.status_code == 200
    
    data = response.json()
    assert data['name'] == 'testcollection'
    assert data['description'] == 'a test collection for the testuser'
    assert data['owner_id'] == test_collection.owner_id
    assert 'items' in data
    assert len(data['items']) == 3  # We created 3 items in the fixture

def test_get_collection_unauthorized(authorized_client, other_user_collection):
    """Test that a user cannot get another user's collection."""
    response = authorized_client.get(f'/collections/{other_user_collection.id}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']
    
def test_get_collection_dne(authorized_client, test_collection):
    response = authorized_client.get(f'/collections/{test_collection.id + 1}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_update_collection(authorized_client, test_collection):
    update_data = {
        "name": "updatedname",
        "description": "updateddescription"
    }

    response = authorized_client.patch(
        f"/collections/{test_collection.id}",
        json=update_data
    )
    assert response.status_code == 200

    data = response.json()
    assert data['name'] == 'updatedname'
    assert data['description'] == 'updateddescription'
    assert data['owner_id'] == test_collection.owner_id
    assert 'items' in data
    assert len(data['items']) == 3

def test_update_collection_unauthorized(authorized_client, other_user_collection):
    """Test that a user cannot update another user's collection."""
    update_data = {
        "name": "updatedname",
        "description": "updateddescription"
    }
    response = authorized_client.patch(
        f"/collections/{other_user_collection.id}",
        json=update_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_update_collection_dne(authorized_client, test_collection):
    update_data = {
        "name": "updatedname dne",
        "description": "updateddescription dne"
    }

    response = authorized_client.patch(
        f"/collections/{99999}",
        json=update_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_delete_collection(authorized_client, test_collection):
    response = authorized_client.delete(f"/collections/{test_collection.id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_delete_collection_dne(authorized_client, test_collection):
    response = authorized_client.delete(f"/collections/{9999}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_collection_unauthorized(authorized_client, other_user_collection):
    """Test that a user cannot delete another user's collection."""
    response = authorized_client.delete(f"/collections/{other_user_collection.id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_get_collection_items(authorized_client, test_collection):
    """Test getting all items from a collection."""
    response = authorized_client.get(f'/collections/{test_collection.id}/items')
    assert response.status_code == 200
    
    items = response.json()
    assert len(items) == 3
    for i, item in enumerate(items):
        assert item['name'] == f'item{i+1}'
        assert item['description'] == 'test description'
        assert item['collection_id'] == test_collection.id
        assert len(item['images']) == 3
        assert len(item['tags']) == 3

def test_get_collection_items_unauthorized(authorized_client, other_user_collection):
    """Test that a user cannot get items from another user's collection."""
    response = authorized_client.get(f'/collections/{other_user_collection.id}/items')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_get_collection_items_dne(authorized_client, test_collection):
    """Test getting items from a non-existent collection."""
    response = authorized_client.get(f'/collections/{9999}/items')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_create_item(authorized_client, test_collection):
    """Test creating a new item in a collection."""
    item_data = {
        "name": "newitem",
        "description": "new item description",
        "collection_id": test_collection.id
    }

    response = authorized_client.post(
        f'/collections/{test_collection.id}/items',
        json=item_data
    )
    assert response.status_code == status.HTTP_201_CREATED

    item = response.json()
    assert item['name'] == item_data['name']
    assert item['description'] == item_data['description']
    assert item['collection_id'] == test_collection.id
    assert len(item['tags']) == 0  # Tags are handled separately
    assert len(item['images']) == 0  # Images are handled separately

def test_create_item_unauthorized(authorized_client, other_user_collection):
    """Test that a user cannot create an item in another user's collection."""
    item_data = {
        "name": "newitem",
        "description": "new item description",
        "collection_id": other_user_collection.id,
        "tags": ["tag1", "tag2", "tag3"]
    }
    
    response = authorized_client.post(
        f'/collections/{other_user_collection.id}/items',
        json=item_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

def test_create_item_dne(authorized_client, test_collection):
    """Test creating an item in a non-existent collection."""
    item_data = {
        "name": "newitem",
        "description": "new item description",
        "collection_id": 9999,
        "tags": ["tag1", "tag2", "tag3"]
    }
    
    response = authorized_client.post(
        f'/collections/{9999}/items',
        json=item_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()['detail']

