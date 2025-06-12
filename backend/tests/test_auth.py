import pytest
from fastapi import status

def test_register_user(client):
    """Test user registration."""
    user_data = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "newpass123"
    }
    
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == user_data["username"]
    assert data["email"] == user_data["email"]
    assert "hashed_password" not in data

def test_register_duplicate_username(client, test_user):
    """Test registration with duplicate username."""
    user_data = {
        "username": "testuser",  # Same as test_user
        "email": "different@example.com",
        "password": "newpass123"
    }
    
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Username already registered" in response.json()["detail"]

def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email."""
    user_data = {
        "username": "differentuser",
        "email": "test@example.com",  # Same as test_user
        "password": "newpass123"
    }
    
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email already registered" in response.json()["detail"]

def test_login_success(client, test_user):
    """Test successful login."""
    login_data = {
        "username": "testuser",
        "password": "testpass"
    }
    
    response = client.post("/auth/token", data=login_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client, test_user):
    """Test login with wrong password."""
    login_data = {
        "username": "testuser",
        "password": "wrongpass"
    }
    
    response = client.post("/auth/token", data=login_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect username or password" in response.json()["detail"]

def test_login_nonexistent_user(client):
    """Test login with non-existent user."""
    login_data = {
        "username": "nonexistent",
        "password": "testpass"
    }
    
    response = client.post("/auth/token", data=login_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect username or password" in response.json()["detail"]

def test_update_username(authorized_client, test_user):
    """Test updating username."""
    update_data = {
        "new_username": "updateduser",
        "current_password": "testpass"
    }
    
    response = authorized_client.patch("/auth/me", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == update_data["new_username"]

def test_update_username_wrong_password(authorized_client, test_user):
    """Test updating username with wrong password."""
    update_data = {
        "new_username": "updateduser",
        "current_password": "wrongpass"
    }
    
    response = authorized_client.patch("/auth/me", json=update_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect password" in response.json()["detail"]

def test_delete_account(authorized_client, test_user):
    """Test account deletion."""
    response = authorized_client.delete(
        "/auth/me",
        params={"current_password": "testpass"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_delete_account_wrong_password(authorized_client, test_user):
    """Test account deletion with wrong password."""
    response = authorized_client.delete(
        "/auth/me",
        params={"current_password": "wrongpass"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect password" in response.json()["detail"] 