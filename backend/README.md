# ARCHIVED Backend

A FastAPI-based backend for the ARCHIVED application, providing REST API endpoints for managing collections, items, images, and user authentication.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Collection Management**: Create, read, update, and delete collections
- **Item Management**: Organize items within collections with descriptions and metadata
- **Image Upload**: Upload and manage images for items with automatic compression
- **Tagging System**: Flexible tagging system for categorizing items
- **Public Sharing**: Share collections publicly with secure token-based links
- **Contact Form**: Rate-limited contact form with email notifications
- **File Management**: Secure file upload with validation and compression

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM)
- **Pydantic**: Data validation and settings management
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Pillow**: Image processing and compression
- **Pytest**: Testing framework

## Project Structure

```
backend/
├── __init__.py
├── main.py                 # FastAPI application entry point
├── config.py              # Application configuration
├── database.py            # Database connection and session management
├── models.py              # SQLAlchemy database models
├── schemas.py             # Pydantic schemas for request/response validation
├── auth/
│   └── auth_handler.py    # Authentication and authorization logic
├── routers/
│   ├── auth.py           # Authentication endpoints
│   ├── users.py          # User management endpoints
│   ├── collections.py    # Collection management endpoints
│   ├── items.py          # Item management endpoints
│   ├── images.py         # Image management endpoints
│   ├── contact.py        # Contact form endpoints
│   ├── share.py          # Collection sharing endpoints
│   └── utils.py          # Utility functions
├── tests/                # Test suite
└── uploads/              # File upload directory
```

## Installation

### Prerequisites

- Python 3.8+
- Poetry (for dependency management)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd archived/backend
   ```

2. **Install dependencies**
   ```bash
   poetry install
   ```

3. **Set up environment variables**
   ```bash
   cp env_example.txt .env
   # Edit .env with your configuration
   ```

4. **Required environment variables**
   ```env
   DATABASE_URL=sqlite:///./archived.db
   SECRET_KEY=your-secret-key-here-minimum-32-characters
   ```

5. **Run the application**
   ```bash
   poetry run uvicorn backend.main:app --reload
   ```

The API will be available at `http://localhost:8000`

## Configuration

### Environment Variables

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#configuration) for a complete list of configuration options.

### Database

The application supports SQLite (default) and PostgreSQL. Update the `DATABASE_URL` environment variable to use a different database:

```env
# SQLite (default)
DATABASE_URL=sqlite:///./archived.db

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost/archived
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Complete API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Development

### Running the Server

```bash
# Development server with auto-reload
poetry run uvicorn backend.main:app --reload

# Production server
poetry run uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Database Management

```bash
# Reset database (development only)
poetry run python backend/reset_db.py

# Run database migrations (if using Alembic)
poetry run alembic upgrade head
```

### Testing

```bash
# Run all tests
poetry run pytest backend/tests

# Run specific test file
poetry run pytest backend/tests/test_auth.py -v

# Run with coverage
poetry run pytest backend/tests --cov=backend --cov-report=html
```

### Code Quality

```bash
# Format code
poetry run black backend/

# Lint code
poetry run flake8 backend/

# Type checking
poetry run mypy backend/
```

## Security

### Authentication

- JWT tokens with configurable expiration times
- Bcrypt password hashing
- Refresh token rotation for enhanced security

### File Upload Security

- File type validation
- File size limits
- Automatic image compression
- Secure file storage

### Rate Limiting

- Contact form rate limiting to prevent spam
- Configurable rate limits per IP address

## Deployment

### Production Considerations

1. **Environment Variables**
   - Set strong `SECRET_KEY`
   - Configure production database URL
   - Set up proper CORS origins
   - Configure SMTP settings for email notifications

2. **File Storage**
   - Use cloud storage (AWS S3, Google Cloud Storage) instead of local files
   - Configure CDN for image delivery

3. **Security**
   - Enable HTTPS
   - Use environment-specific configurations
   - Set up proper logging and monitoring

4. **Database**
   - Use PostgreSQL for production
   - Set up database backups
   - Configure connection pooling

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev

# Copy application code
COPY backend/ ./backend/

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- Follow PEP 8 guidelines
- Use type hints
- Write comprehensive docstrings
- Add tests for new features

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` environment variable
   - Ensure database server is running
   - Verify database permissions

2. **Authentication Issues**
   - Verify `SECRET_KEY` is set and at least 32 characters
   - Check token expiration settings
   - Ensure proper CORS configuration

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure allowed file extensions are configured

4. **Email Issues**
   - Configure SMTP settings
   - Check email credentials
   - Verify network connectivity

### Logs

Enable debug logging by setting the log level:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the troubleshooting section
3. Submit an issue on the project repository
4. Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- User authentication and management
- Collection and item management
- Image upload and management
- Tagging system
- Public sharing functionality
- Contact form with rate limiting
- Comprehensive test coverage
- API documentation
