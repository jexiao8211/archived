import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.config import settings

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
async def submit_contact_form(contact_data: ContactFormData):
    """
    Submit a contact form and send email notification.
    """
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
        
        return {"message": "Contact form submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing contact form: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        ) 