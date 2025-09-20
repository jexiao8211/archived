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
    assert "refresh_token" in data  # Current API returns both tokens
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

def test_refresh_token(client, test_user):
    """Test token refresh functionality."""
    # First login to get tokens
    login_data = {
        "username": "testuser",
        "password": "testpass"
    }
    
    login_response = client.post("/auth/token", data=login_data)
    assert login_response.status_code == status.HTTP_200_OK
    tokens = login_response.json()
    
    # Use refresh token to get new tokens
    refresh_data = {
        "refresh_token": tokens["refresh_token"]
    }
    
    response = client.post("/auth/refresh", json=refresh_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    # New refresh token should be different from original (access token might be same due to timing)
    assert data["refresh_token"] != tokens["refresh_token"]

def test_refresh_invalid_token(client):
    """Test refresh with invalid token."""
    refresh_data = {
        "refresh_token": "invalid_token"
    }
    
    response = client.post("/auth/refresh", json=refresh_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate refresh token" in response.json()["detail"] 