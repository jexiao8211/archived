import pytest
from fastapi import status
from datetime import datetime, timezone


def test_get_shared_collection_success(authorized_client, test_collection):
    """Test successfully getting a shared collection with valid token."""
    # First create a share for the collection
    share_response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert share_response.status_code == status.HTTP_200_OK
    share_data = share_response.json()
    token = share_data["token"]
    
    # Now get the shared collection
    response = authorized_client.get(f"/share/{token}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["name"] == test_collection.name
    assert data["description"] == test_collection.description
    assert data["owner_id"] == test_collection.owner_id
    assert len(data["items"]) == 3  # From fixture
    # Items should be sorted by item_order
    for i, item in enumerate(data["items"]):
        assert item["item_order"] == i


def test_get_shared_collection_invalid_token(authorized_client):
    """Test getting a shared collection with invalid token."""
    response = authorized_client.get("/share/invalid-token")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Invalid or disabled share link" in response.json()["detail"]


def test_get_shared_collection_disabled_token(authorized_client, test_collection):
    """Test getting a shared collection with disabled token."""
    # Create a share
    share_response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert share_response.status_code == status.HTTP_200_OK
    token = share_response.json()["token"]
    
    # Disable the share
    disable_response = authorized_client.delete(f"/share/collections/{test_collection.id}")
    assert disable_response.status_code == status.HTTP_200_OK
    
    # Try to get the shared collection
    response = authorized_client.get(f"/share/{token}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Invalid or disabled share link" in response.json()["detail"]


def test_get_shared_item_success(authorized_client, test_collection):
    """Test successfully getting a shared item with valid token."""
    # First create a share for the collection
    share_response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert share_response.status_code == status.HTTP_200_OK
    token = share_response.json()["token"]
    
    # Get the first item from the collection
    items_response = authorized_client.get(f"/collections/{test_collection.id}/items")
    assert items_response.status_code == status.HTTP_200_OK
    items = items_response.json()
    item_id = items[0]["id"]
    
    # Now get the shared item
    response = authorized_client.get(f"/share/{token}/items/{item_id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["id"] == item_id
    assert data["collection_id"] == test_collection.id
    assert data["name"] == items[0]["name"]
    assert data["description"] == items[0]["description"]


def test_get_shared_item_invalid_token(authorized_client, test_collection):
    """Test getting a shared item with invalid token."""
    # Get an item ID from the collection
    items_response = authorized_client.get(f"/collections/{test_collection.id}/items")
    assert items_response.status_code == status.HTTP_200_OK
    items = items_response.json()
    item_id = items[0]["id"]
    
    response = authorized_client.get(f"/share/invalid-token/items/{item_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Invalid or disabled share link" in response.json()["detail"]


def test_get_shared_item_wrong_collection(authorized_client, test_collection, other_user_collection, other_user, client):
    """Test getting a shared item that doesn't belong to the shared collection."""
    # Create a share for test_collection
    share_response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert share_response.status_code == status.HTTP_200_OK
    token = share_response.json()["token"]
    
    # Create a client authenticated as other_user to get an item from their collection
    from fastapi.testclient import TestClient
    
    # Login as other_user to get their token
    login_response = client.post(
        "/auth/token",
        data={"username": other_user.username, "password": "otherpass"}
    )
    assert login_response.status_code == status.HTTP_200_OK
    other_user_token = login_response.json()["access_token"]
    
    # Create authenticated client for other_user
    other_user_client = TestClient(client.app)
    other_user_client.headers.update({"Authorization": f"Bearer {other_user_token}"})
    
    # Get an item from other_user_collection using other_user's client
    items_response = other_user_client.get(f"/collections/{other_user_collection.id}/items")
    assert items_response.status_code == status.HTTP_200_OK
    items = items_response.json()
    item_id = items[0]["id"]
    
    # Try to get the item using the wrong token (from test_collection, not other_user_collection)
    response = authorized_client.get(f"/share/{token}/items/{item_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found in shared collection" in response.json()["detail"]


def test_get_shared_item_nonexistent_item(authorized_client, test_collection):
    """Test getting a non-existent item from a shared collection."""
    # Create a share for the collection
    share_response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert share_response.status_code == status.HTTP_200_OK
    token = share_response.json()["token"]
    
    # Try to get a non-existent item
    response = authorized_client.get(f"/share/{token}/items/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Item not found in shared collection" in response.json()["detail"]


def test_create_share_success(authorized_client, test_collection):
    """Test successfully creating a share for a collection."""
    response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "token" in data
    assert "url" in data
    assert data["is_enabled"] is True
    assert len(data["token"]) > 0  # Should be a valid UUID hex


def test_create_share_unauthorized(client, test_collection):
    """Test creating a share without authentication."""
    response = client.post(f"/share/collections/{test_collection.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_share_nonexistent_collection(authorized_client):
    """Test creating a share for a non-existent collection."""
    response = authorized_client.post("/share/collections/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()["detail"]


def test_create_share_other_user_collection(authorized_client, other_user_collection):
    """Test creating a share for another user's collection."""
    response = authorized_client.post(f"/share/collections/{other_user_collection.id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Collection not found or you don't have access to it" in response.json()["detail"]


def test_enable_existing_share(authorized_client, test_collection):
    """Test enabling an existing share (rotate=false)."""
    # Create initial share
    response1 = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response1.status_code == status.HTTP_200_OK
    token1 = response1.json()["token"]
    
    # Disable the share
    disable_response = authorized_client.delete(f"/share/collections/{test_collection.id}")
    assert disable_response.status_code == status.HTTP_200_OK
    
    # Re-enable the share (should return same token)
    response2 = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response2.status_code == status.HTTP_200_OK
    token2 = response2.json()["token"]
    
    assert token1 == token2  # Should be the same token


def test_rotate_share_token(authorized_client, test_collection):
    """Test rotating a share token (rotate=true)."""
    # Create initial share
    response1 = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response1.status_code == status.HTTP_200_OK
    token1 = response1.json()["token"]
    
    # Rotate the token
    response2 = authorized_client.post(f"/share/collections/{test_collection.id}?rotate=true")
    assert response2.status_code == status.HTTP_200_OK
    token2 = response2.json()["token"]
    
    assert token1 != token2  # Should be different tokens
    
    # Old token should not work
    old_response = authorized_client.get(f"/share/{token1}")
    assert old_response.status_code == status.HTTP_404_NOT_FOUND
    
    # New token should work
    new_response = authorized_client.get(f"/share/{token2}")
    assert new_response.status_code == status.HTTP_200_OK


def test_disable_share_success(authorized_client, test_collection):
    """Test successfully disabling a share."""
    # First create a share
    create_response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert create_response.status_code == status.HTTP_200_OK
    token = create_response.json()["token"]
    
    # Verify the share works
    get_response = authorized_client.get(f"/share/{token}")
    assert get_response.status_code == status.HTTP_200_OK
    
    # Disable the share
    disable_response = authorized_client.delete(f"/share/collections/{test_collection.id}")
    assert disable_response.status_code == status.HTTP_200_OK
    assert disable_response.json()["status"] == "disabled"
    
    # Verify the share no longer works
    get_response = authorized_client.get(f"/share/{token}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_disable_share_unauthorized(client, test_collection):
    """Test disabling a share without authentication."""
    response = client.delete(f"/share/collections/{test_collection.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_disable_share_nonexistent(authorized_client):
    """Test disabling a share that doesn't exist."""
    response = authorized_client.delete("/share/collections/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Share link not found" in response.json()["detail"]


def test_disable_share_other_user_collection(authorized_client, other_user_collection):
    """Test disabling a share for another user's collection."""
    response = authorized_client.delete(f"/share/collections/{other_user_collection.id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Share link not found" in response.json()["detail"]


def test_share_url_format(authorized_client, test_collection):
    """Test that share URL is properly formatted."""
    response = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "url" in data
    assert data["url"].endswith(f"/share/{data['token']}")


def test_multiple_shares_same_collection(authorized_client, test_collection):
    """Test that only one share can exist per collection."""
    # Create first share
    response1 = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response1.status_code == status.HTTP_200_OK
    token1 = response1.json()["token"]
    
    # Create second share (should update existing, not create new)
    response2 = authorized_client.post(f"/share/collections/{test_collection.id}")
    assert response2.status_code == status.HTTP_200_OK
    token2 = response2.json()["token"]
    
    # Both tokens should work (same share, just re-enabled)
    assert token1 == token2
    
    get_response = authorized_client.get(f"/share/{token1}")
    assert get_response.status_code == status.HTTP_200_OK
