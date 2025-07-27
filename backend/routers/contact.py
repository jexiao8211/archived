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
    """Extract client IP address from request."""
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
    Returns True if rate limit is exceeded, False otherwise.
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
    """Get remaining requests allowed for this IP."""
    if ip_address not in rate_limit_store:
        return RATE_LIMIT_MAX_REQUESTS
    
    count, window_start = rate_limit_store[ip_address]
    current_time = time.time()
    
    if current_time - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        return RATE_LIMIT_MAX_REQUESTS
    
    return max(0, RATE_LIMIT_MAX_REQUESTS - count)

router = APIRouter(prefix="/contact", tags=["contact"])

class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send an email using SMTP.
    Returns True if successful, False otherwise.
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
    Useful for frontend to show remaining requests.
    """
    client_ip = get_client_ip(request)
    remaining_requests = get_rate_limit_remaining(client_ip)
    
    return {
        "remaining_requests": remaining_requests,
        "max_requests": RATE_LIMIT_MAX_REQUESTS,
        "window_seconds": RATE_LIMIT_WINDOW_SECONDS
    } 