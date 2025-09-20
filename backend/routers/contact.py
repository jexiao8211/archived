"""
Contact Form Router for ARCHIVED Application

This module handles contact form functionality including form submission,
email notifications, and rate limiting to prevent spam. Provides endpoints
for submitting contact forms and checking rate limit status.

Includes built-in rate limiting and email notification system.

Author: ARCHIVED Team
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
import time
from backend.config import settings

# Rate limiting storage (in-memory for now, can be upgraded to Redis)
# Format: {ip_address: (count, window_start_time)}
rate_limit_store: Dict[str, Tuple[int, float]] = {}

# Rate limiting configuration
RATE_LIMIT_MAX_REQUESTS = settings.RATE_LIMIT_MAX_REQUESTS
RATE_LIMIT_WINDOW_SECONDS = settings.RATE_LIMIT_WINDOW_SECONDS

def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request.
    
    Handles various proxy and load balancer configurations by checking
    forwarded headers before falling back to the direct client IP.
    
    Args:
        request (Request): FastAPI request object
        
    Returns:
        str: Client IP address or "unknown" if not available
    """
    # Check for forwarded headers (for proxy/load balancer setups)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to client host
    return request.client.host if request.client else "unknown"

def check_rate_limit(ip_address: str) -> bool:
    """
    Check if the IP address has exceeded the rate limit.
    
    Implements a sliding window rate limiting mechanism. Returns True if the
    rate limit is exceeded, False otherwise. Automatically increments the
    request count for the IP address.
    
    Args:
        ip_address (str): The IP address to check
        
    Returns:
        bool: True if rate limit exceeded, False otherwise
    """
    current_time = time.time()
    
    if ip_address in rate_limit_store:
        count, window_start = rate_limit_store[ip_address]
        
        # Check if we're still in the same time window
        if current_time - window_start < RATE_LIMIT_WINDOW_SECONDS:
            # Still in window, check count
            if count >= RATE_LIMIT_MAX_REQUESTS:
                return True  # Rate limit exceeded
            else:
                # Increment count
                rate_limit_store[ip_address] = (count + 1, window_start)
                return False
        else:
            # Window expired, reset
            rate_limit_store[ip_address] = (1, current_time)
            return False
    else:
        # First request from this IP
        rate_limit_store[ip_address] = (1, current_time)
        return False

def get_rate_limit_remaining(ip_address: str) -> int:
    """
    Get remaining requests allowed for this IP address.
    
    Calculates how many more requests the IP address can make within
    the current rate limit window.
    
    Args:
        ip_address (str): The IP address to check
        
    Returns:
        int: Number of remaining requests allowed
    """
    if ip_address not in rate_limit_store:
        return RATE_LIMIT_MAX_REQUESTS
    
    count, window_start = rate_limit_store[ip_address]
    current_time = time.time()
    
    if current_time - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        return RATE_LIMIT_MAX_REQUESTS
    
    return max(0, RATE_LIMIT_MAX_REQUESTS - count)

router = APIRouter(prefix="/contact", tags=["contact"])

# API Endpoints:
# POST    /contact/                    # Submit contact form
# GET     /contact/rate-limit-info     # Get rate limit information

class ContactFormData(BaseModel):
    """
    Schema for contact form data.
    
    Attributes:
        name (str): Sender's name
        email (EmailStr): Sender's email address
        subject (str): Email subject line
        message (str): Email message content
    """
    name: str
    email: EmailStr
    subject: str
    message: str

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send an email using SMTP.
    
    Sends an email using the configured SMTP settings. Handles TLS encryption
    and authentication. Returns True if successful, False otherwise.
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject line
        body (str): Email message body
        
    Returns:
        bool: True if email sent successfully, False otherwise
        
    Note:
        Requires SMTP credentials to be configured in settings.
    """
    try:
        # Get email configuration from settings
        smtp_server = settings.SMTP_SERVER
        smtp_port = settings.SMTP_PORT
        smtp_username = settings.SMTP_USERNAME
        smtp_password = settings.SMTP_PASSWORD
        
        if not smtp_username or not smtp_password:
            print("Warning: SMTP credentials not configured. Email will not be sent.")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body to email
        msg.attach(MIMEText(body, 'plain'))
        
        # Create SMTP session
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Enable TLS
        server.login(smtp_username, smtp_password)
        
        # Send email
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@router.post("/")
async def submit_contact_form(contact_data: ContactFormData, request: Request):
    """
    Submit a contact form and send email notification.
    
    Processes contact form submissions with rate limiting to prevent spam.
    Sends email notifications to the admin and confirmation emails to the sender.
    
    Args:
        contact_data (ContactFormData): Contact form data
        request (Request): FastAPI request object for IP extraction
        
    Returns:
        dict: Success message and rate limit information
        
    Raises:
        HTTPException: If rate limit exceeded or email configuration error
    """
    # Get client IP for rate limiting
    client_ip = get_client_ip(request)
    
    # Check rate limit
    if check_rate_limit(client_ip):
        remaining_time = RATE_LIMIT_WINDOW_SECONDS - (time.time() - rate_limit_store[client_ip][1])
        raise HTTPException(
            status_code=429,  # Too Many Requests
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many contact form submissions. Please try again in {int(remaining_time / 60)} minutes.",
                "retry_after": int(remaining_time)
            }
        )
    
    try:
        # Get the admin email from settings
        admin_email = settings.ADMIN_EMAIL
        if not admin_email:
            raise HTTPException(
                status_code=500, 
                detail="Admin email not configured"
            )
        
        # Create email body
        email_body = f"""
New Contact Form Submission

Name: {contact_data.name}
Email: {contact_data.email}
Subject: {contact_data.subject}

Message:
{contact_data.message}

---
This message was sent from the ARCHIVED contact form.
        """.strip()
        
        # Send email to admin
        email_sent = send_email(
            to_email=admin_email,
            subject=f"Contact Form: {contact_data.subject}",
            body=email_body
        )
        
        if not email_sent:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email notification"
            )
        
        # Send confirmation email to user
        confirmation_body = f"""
Dear {contact_data.name},

Thank you for contacting us! We have received your message and will get back to you as soon as possible.

Your message:
Subject: {contact_data.subject}
Message: {contact_data.message}

Best regards,
The ARCHIVED Team
        """.strip()
        
        send_email(
            to_email=contact_data.email,
            subject="We received your message - ARCHIVED",
            body=confirmation_body
        )
        
        # Return success with rate limit info
        remaining_requests = get_rate_limit_remaining(client_ip)
        return {
            "message": "Contact form submitted successfully",
            "rate_limit": {
                "remaining_requests": remaining_requests,
                "window_reset": int(time.time() + RATE_LIMIT_WINDOW_SECONDS)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing contact form: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.get("/rate-limit-info")
async def get_rate_limit_info(request: Request):
    """
    Get rate limit information for the current client.
    
    Returns the current rate limit status for the client's IP address.
    Useful for frontend applications to display remaining request counts.
    
    Args:
        request (Request): FastAPI request object for IP extraction
        
    Returns:
        dict: Rate limit information including remaining requests and window details
    """
    client_ip = get_client_ip(request)
    remaining_requests = get_rate_limit_remaining(client_ip)
    
    return {
        "remaining_requests": remaining_requests,
        "max_requests": RATE_LIMIT_MAX_REQUESTS,
        "window_seconds": RATE_LIMIT_WINDOW_SECONDS
    } 