# backend/tests/test_contact.py
import pytest
from fastapi import status
from unittest.mock import patch # <-- add this import

def test_contact_form_rate_limiting(client):
    """Test that rate limiting works correctly for contact form submissions."""
    
    # Test data
    contact_data = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Test Subject",
        "message": "Test message"
    }

    # Use a mock patch to prevent the actual email from being sent
    with patch("backend.routers.contact.send_email", return_value=True):
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

def test_rate_limit_info_endpoint(client):
    """Test the rate limit info endpoint."""
    with patch("backend.routers.contact.send_email", return_value=True):
        response = client.get("/contact/rate-limit-info")
        assert response.status_code == 200
        
        data = response.json()
        assert "remaining_requests" in data
        assert "max_requests" in data
        assert "window_seconds" in data
        assert data["max_requests"] == 3
        assert data["window_seconds"] == 86400  # Current API uses 86400 seconds (24 hours)

def test_contact_form_validation(client):
    """Test that contact form validation works correctly."""
    
    with patch("backend.routers.contact.send_email", return_value=True):
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

def test_contact_form_success_response(client):
    """Test that successful contact form submission returns proper response."""
    contact_data = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Test Subject",
        "message": "Test message"
    }
    
    with patch("backend.routers.contact.send_email", return_value=True):
        response = client.post("/contact/", json=contact_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "rate_limit" in data
        assert "remaining_requests" in data["rate_limit"]
        assert "window_reset" in data["rate_limit"]
        assert data["message"] == "Contact form submitted successfully"