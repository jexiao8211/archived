import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_contact_form_rate_limiting():
    """Test that rate limiting works correctly for contact form submissions."""
    
    # Test data
    contact_data = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Test Subject",
        "message": "Test message"
    }
    
    # First submission should succeed
    response = client.post("/contact/", json=contact_data)
    assert response.status_code == 200
    
    # Second submission should succeed
    response = client.post("/contact/", json=contact_data)
    assert response.status_code == 200
    
    # Third submission should succeed
    response = client.post("/contact/", json=contact_data)
    assert response.status_code == 200
    
    # Fourth submission should be rate limited
    response = client.post("/contact/", json=contact_data)
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]["error"]

def test_rate_limit_info_endpoint():
    """Test the rate limit info endpoint."""
    response = client.get("/contact/rate-limit-info")
    assert response.status_code == 200
    
    data = response.json()
    assert "remaining_requests" in data
    assert "max_requests" in data
    assert "window_seconds" in data
    assert data["max_requests"] == 3
    assert data["window_seconds"] == 3600

def test_contact_form_validation():
    """Test that contact form validation works correctly."""
    
    # Test with missing required fields
    response = client.post("/contact/", json={
        "name": "Test User",
        "email": "invalid-email",  # Invalid email
        "subject": "Test Subject"
        # Missing message field
    })
    assert response.status_code == 422  # Validation error
    
    # Test with valid data
    response = client.post("/contact/", json={
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Test Subject",
        "message": "Test message"
    })
    assert response.status_code == 200 