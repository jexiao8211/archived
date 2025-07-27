# Contact Form Setup Guide

The contact form feature has been added to your ARCHIVED application. Here's how to set it up:

## Frontend Features

- **Contact Page**: Accessible at `/contact` route
- **Contact Form**: Includes name, email, subject, and message fields
- **Form Validation**: Client-side validation for required fields
- **Success/Error Messages**: User feedback for form submission
- **Responsive Design**: Works on desktop and mobile devices

## Backend Features

- **Email Integration**: Sends contact form submissions to your email
- **Confirmation Emails**: Automatically sends confirmation emails to users
- **SMTP Support**: Uses standard SMTP for email delivery
- **Error Handling**: Graceful error handling for email failures

## Email Configuration

To enable email functionality, you need to set up the following environment variables:

### Required Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

**Note**: These settings are automatically loaded through the `Settings` class in `backend/config.py`. The application will use sensible defaults if not specified.

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASSWORD`

### Other Email Providers

You can use any SMTP provider. Common alternatives:

- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Use your own SMTP server details

## Installation

1. **Install the new dependency**:
   ```bash
   cd backend
   poetry install
   ```

2. **Set up environment variables** as described above

3. **Restart your backend server**

## Usage

1. Users can access the contact form at `/contact`
2. Fill out the form with their information
3. Submit the form
4. You'll receive an email notification
5. The user receives a confirmation email

## Security Notes

- The contact form is publicly accessible (no authentication required)
- Email credentials are stored in environment variables
- Consider implementing rate limiting for production use
- The form includes basic validation but consider adding CAPTCHA for production

## Customization

You can customize:
- Email templates in `backend/routers/contact.py`
- Form styling in `frontend/src/styles/components/ContactForm.module.css`
- Page styling in `frontend/src/styles/pages/ContactPage.module.css`

## Troubleshooting

- **Emails not sending**: Check SMTP credentials and firewall settings
- **Form not submitting**: Check browser console for errors
- **Styling issues**: Ensure CSS modules are properly imported 