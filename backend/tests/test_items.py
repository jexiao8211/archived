from datetime import datetime, timezone
import pytest
from fastapi import status

# TODO: TEST RE-ORDERING ITEMS
## Create new test function for reordering all items in a collection

# ----- /items/<item_id> ----- #
def test_get_item(authorized_client, test_item):
    """Test getting a specific item."""
    response = authorized_client.get(f'/items/{test_item.id}')
    assert response.status_code == 200
    
    item = response.json()
    assert item['name'] == test_item.name
    assert item['description'] == test_item.description
    assert item['collection_id'] == test_item.collection_id
    assert item['item_order'] == test_item.item_order

    created_date = datetime.fromisoformat(item['created_date']).replace(second=0, microsecond=0, tzinfo=None)
    updated_date = datetime.fromisoformat(item['updated_date']).replace(second=0, microsecond=0, tzinfo=None)
    assert created_date == datetime(1999, 1, 1, tzinfo=timezone.utc).replace(second=0, microsecond=0, tzinfo=None)
    assert updated_date == datetime(2001, 12, 30, tzinfo=timezone.utc).replace(second=0, microsecond=0, tzinfo=None)
    
    assert len(item['tags']) == 3  # From fixture
    assert len(item['images']) == 3  # From fixture

def test_get_item_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot get another user's item."""
    response = authorized_client.get(f'/items/{other_user_item.id}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_get_item_dne(authorized_client, test_item):
    """Test getting a non-existent item."""
    response = authorized_client.get(f'/items/{9999}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_update_item(authorized_client, test_item):
    """Test updating an item."""
    update_data = {
        "name": "updatedname",
        "description": "updateddescription",
    }

    response = authorized_client.patch(
        f'/items/{test_item.id}',
        json=update_data
    )
    assert response.status_code == 200

    item = response.json()
    assert item['name'] == update_data['name']
    assert item['description'] == update_data['description']
    assert item['collection_id'] == 1
    assert item['item_order'] == 99
    assert len(item['tags']) == 3  # Tags should be preserved
    assert len(item['images']) == 3  # Images should be preserved

def test_update_item_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot update another user's item."""
    update_data = {
        "name": "updatedname",
        "description": "updateddescription",
        "collection_id": other_user_item.collection_id
    }
    response = authorized_client.patch(
        f'/items/{other_user_item.id}',
        json=update_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_update_item_dne(authorized_client, test_item):
    """Test updating a non-existent item."""
    update_data = {
        "name": "updatedname",
        "description": "updateddescription",
        "collection_id": test_item.collection_id
    }
    response = authorized_client.patch(
        f'/items/{9999}',
        json=update_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_delete_item(authorized_client, test_item):
    """Test deleting an item."""
    response = authorized_client.delete(f'/items/{test_item.id}')
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_delete_item_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot delete another user's item."""
    response = authorized_client.delete(f'/items/{other_user_item.id}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_delete_item_dne(authorized_client, test_item):
    """Test deleting a non-existent item."""
    response = authorized_client.delete(f'/items/{9999}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']


# ----- /items/<item_id>/tags ----- #
def test_get_item_tags(authorized_client, test_item):
    """Test getting all tags from an item."""
    response = authorized_client.get(f'/items/{test_item.id}/tags')
    assert response.status_code == 200
    
    tags = response.json()
    assert len(tags) == 3  # From fixture
    for i, tag in enumerate(tags):
        assert tag['name'].startswith('tag')  # From fixture

def test_get_item_tags_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot get tags from another user's item."""
    response = authorized_client.get(f'/items/{other_user_item.id}/tags')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_get_item_tags_dne(authorized_client, test_item):
    """Test getting tags from a non-existent item."""
    response = authorized_client.get(f'/items/{9999}/tags')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_add_item_tags(authorized_client, test_item):
    """Test adding tags to an item."""
    tag_data = {
        "tags": ["newtag1", "newtag2", "newtag3"]
    }
    
    response = authorized_client.post(
        f'/items/{test_item.id}/tags',
        json=tag_data
    )
    assert response.status_code == 200
    
    tags = response.json()
    assert len(tags) == 6  # 3 existing tags + 3 new tags
    tag_names = [tag['name'] for tag in tags]
    for tag in tag_data['tags']:
        assert tag in tag_names

def test_add_item_tags_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot add tags to another user's item."""
    tag_data = {
        "tags": ["newtag1", "newtag2", "newtag3"]
    }
    response = authorized_client.post(
        f'/items/{other_user_item.id}/tags',
        json=tag_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_add_item_tags_dne(authorized_client, test_item):
    """Test adding tags to a non-existent item."""
    tag_data = {
        "tags": ["newtag1", "newtag2", "newtag3"]
    }
    response = authorized_client.post(
        f'/items/{9999}/tags',
        json=tag_data
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_delete_item_tags(authorized_client, test_item):
    """Test removing all tags from an item."""
    response = authorized_client.delete(f'/items/{test_item.id}/tags')
    assert response.status_code == 200
    
    tags = response.json()
    assert len(tags) == 0  # All tags should be removed

def test_delete_item_tags_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot delete tags from another user's item."""
    response = authorized_client.delete(f'/items/{other_user_item.id}/tags')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_delete_item_tags_dne(authorized_client, test_item):
    """Test deleting tags from a non-existent item."""
    response = authorized_client.delete(f'/items/{9999}/tags')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']


# ----- /items/<item_id>/images ----- #
# TODO: Create test for upload_item_images when in deployment env


# def test_add_item_images(authorized_client, test_item):
#     """Test adding images to an item."""
#     image_urls = ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
#     response = authorized_client.post(
#         f"/items/{test_item.id}/images",
#         json=image_urls
#     )
#     assert response.status_code == 200
#     data = response.json()
#     assert len(data) == 5
#     for i in range(3):
#         assert data[i]['image_url'] == f'testurl{i+1}'
#     assert data[3]["image_url"] == image_urls[0]
#     assert data[4]["image_url"] == image_urls[1]

# def test_add_item_images_unauthorized(authorized_client, other_user_item):
#     """Test that a user cannot add images to another user's item."""
#     image_urls = ["https://example_unauth.com/image1.jpg", "https://example_unauth.com/image2.jpg"]
#     response = authorized_client.post(
#         f"/items/{other_user_item.id}/images",
#         json=image_urls
#     )
#     assert response.status_code == status.HTTP_404_NOT_FOUND
#     assert "Item not found or you don't have access to it" in response.json()['detail']

# def test_add_item_images_dne(authorized_client, test_item):
#     """Test adding images to a non-existent item."""
#     image_urls = ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
#     response = authorized_client.post(
#         f"/items/{9999}/images",
#         json=image_urls
#     )
#     assert response.status_code == status.HTTP_404_NOT_FOUND
#     assert "Item not found or you don't have access to it" in response.json()['detail']

def test_get_item_images(authorized_client, test_item):
    """Test getting all images for an item."""
    response = authorized_client.get(f"/items/{test_item.id}/images")
    assert response.status_code == 200
    
    images = response.json()
    assert len(images) == 3  # From fixture
    for i, image in enumerate(images):
        assert image["image_url"] == f"testurl{i+1}"  # From fixture
        assert image["item_id"] == test_item.id

def test_get_item_images_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot get images from another user's item."""
    response = authorized_client.get(f"/items/{other_user_item.id}/images")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']

def test_get_item_images_dne(authorized_client, test_item):
    """Test getting images from a non-existent item."""
    response = authorized_client.get(f"/items/{9999}/images")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found or you don't have access to it" in response.json()['detail']


# Note: Image order updates are handled in the main image update endpoint
# The separate image order endpoint doesn't exist in the current implementation
# This functionality is part of the PATCH /items/{item_id}/images endpoint


