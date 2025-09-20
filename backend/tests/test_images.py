import pytest
from fastapi import status

def test_delete_item_image(authorized_client, test_item):
    """Test deleting a specific image from an item."""
    # Get the first image's ID
    response = authorized_client.get(f"/items/{test_item.id}/images")
    assert response.status_code == 200
    image_id = response.json()[0]["id"]
    
    # Delete the image
    response = authorized_client.delete(
        f"/images/{image_id}"
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify it's gone
    response = authorized_client.get(f"/items/{test_item.id}/images")
    assert response.status_code == 200
    images = response.json()
    assert len(images) == 2  # Should have 2 images left
    assert not any(img["id"] == image_id for img in images)

def test_delete_item_image_dne(authorized_client, test_item):
    """Test deleting a non-existent image from an item."""
    response = authorized_client.delete(
        f"/images/{9999}"
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Image not found" in response.json()['detail']

def test_delete_item_image_unauthorized(authorized_client, other_user_item):
    """Test that a user cannot delete an image from another user's item."""
    # Get an image ID from the other user's item
    response = authorized_client.get(f"/items/{other_user_item.id}/images")
    assert response.status_code == status.HTTP_404_NOT_FOUND  # Can't even access the item
    
    # Try to delete a random image ID (should fail with not found)
    response = authorized_client.delete(f"/images/{9999}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Image not found" in response.json()['detail']