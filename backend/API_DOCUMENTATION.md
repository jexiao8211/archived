# ARCHIVED Backend API Documentation

## Overview

The ARCHIVED backend is a FastAPI-based REST API for managing collections, items, images, and user authentication. It provides a comprehensive system for organizing and sharing personal collections with support for tagging, image management, and public sharing.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Collections](#collections)
4. [Items](#items)
5. [Images](#images)
6. [Sharing](#sharing)
7. [Contact](#contact)
8. [Data Models](#data-models)
9. [Error Handling](#error-handling)
10. [Configuration](#configuration)

## Authentication

The API uses JWT (JSON Web Token) authentication with access and refresh tokens.

### Endpoints

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:** `201 Created`
```json
{
  "username": "string",
  "email": "string",
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `400 Bad Request`: Username or email already exists

#### Login
```http
POST /auth/token
```

**Request Body (form-data):**
```
username: string
password: string
```

**Response:** `200 OK`
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

**Security Note:** The refresh token implements token rotation for enhanced security. Each time a refresh token is used, a new unique refresh token is issued, making the previous one invalid. This prevents token reuse attacks.

**Errors:**
- `401 Unauthorized`: Invalid or expired refresh token

## User Management

### Endpoints

#### Get Current User
```http
GET /users/me
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "username": "string",
  "email": "string",
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z"
}
```

#### Update Username
```http
PATCH /users/me
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "new_username": "string",
  "current_password": "string"
}
```

**Response:** `200 OK`
```json
{
  "username": "string",
  "email": "string",
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Incorrect password
- `400 Bad Request`: Username already taken

#### Delete Account
```http
DELETE /users/me
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```
current_password: string
```

**Response:** `204 No Content`

**Errors:**
- `401 Unauthorized`: Incorrect password

## Collections

### Endpoints

#### Get User Collections
```http
GET /users/me/collections
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "owner_id": 1,
    "collection_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z",
    "items": []
  }
]
```

#### Create Collection
```http
POST /users/me/collections
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "owner_id": 1,
  "collection_order": 1,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "items": []
}
```

#### Get Collection
```http
GET /collections/{collection_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "owner_id": 1,
  "collection_order": 0,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "items": []
}
```

**Errors:**
- `404 Not Found`: Collection not found or no access

#### Update Collection
```http
PATCH /collections/{collection_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "owner_id": 1,
  "collection_order": 0,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "items": []
}
```

#### Delete Collection
```http
DELETE /collections/{collection_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

#### Update Collection Order
```http
PATCH /users/me/collections/order
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
[1, 2, 3]
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "owner_id": 1,
    "collection_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z",
    "items": []
  }
]
```

## Items

### Endpoints

#### Get Collection Items
```http
GET /collections/{collection_id}/items
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "collection_id": 1,
    "item_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z",
    "images": [],
    "tags": []
  }
]
```

#### Create Item
```http
POST /collections/{collection_id}/items
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "collection_id": 1,
  "item_order": 1,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "images": [],
  "tags": []
}
```

#### Get Item
```http
GET /items/{item_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "collection_id": 1,
  "item_order": 0,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "images": [],
  "tags": []
}
```

#### Update Item
```http
PATCH /items/{item_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "collection_id": 1,
  "item_order": 0,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "images": [],
  "tags": []
}
```

#### Delete Item
```http
DELETE /items/{item_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

#### Update Item Order
```http
PATCH /collections/{collection_id}/items/order
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "item_ids": [1, 2, 3]
}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "collection_id": 1,
    "item_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z",
    "images": [],
    "tags": []
  }
]
```

### Tags

#### Get Item Tags
```http
GET /items/{item_id}/tags
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "string"
  }
]
```

#### Add Tags to Item
```http
POST /items/{item_id}/tags
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "tags": ["tag1", "tag2", "tag3"]
}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "tag1"
  },
  {
    "id": 2,
    "name": "tag2"
  }
]
```

#### Remove All Tags from Item
```http
DELETE /items/{item_id}/tags
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[]
```

## Images

### Endpoints

#### Get Item Images
```http
GET /items/{item_id}/images
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "image_url": "string",
    "item_id": 1,
    "image_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

#### Upload Images
```http
POST /items/{item_id}/images/upload
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:** `multipart/form-data`
```
files: File[] (multiple image files)
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "image_url": "string",
    "item_id": 1,
    "image_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

**Errors:**
- `400 Bad Request`: Invalid file type or file too large

#### Update Images
```http
PATCH /items/{item_id}/images
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:** `multipart/form-data`
```
deleted_item_images: int[] (IDs of images to delete)
new_files: File[] (new image files to upload)
new_images_order: (int|string)[] (new order for all images)
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "image_url": "string",
    "item_id": 1,
    "image_order": 0,
    "created_date": "2024-01-01T00:00:00Z",
    "updated_date": "2024-01-01T00:00:00Z"
  }
]
```

#### Delete Image
```http
DELETE /images/{image_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `204 No Content`

## Sharing

### Endpoints

#### Get Shared Collection
```http
GET /share/{token}
```

**No authentication required**

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "owner_id": 1,
  "collection_order": 0,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "items": []
}
```

**Errors:**
- `404 Not Found`: Invalid or disabled share link

#### Get Shared Item
```http
GET /share/{token}/items/{item_id}
```

**No authentication required**

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "collection_id": 1,
  "item_order": 0,
  "created_date": "2024-01-01T00:00:00Z",
  "updated_date": "2024-01-01T00:00:00Z",
  "images": [],
  "tags": []
}
```

#### Create Share Link
```http
POST /share/collections/{collection_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `rotate` (optional): `true` to generate new token, `false` to reuse existing

**Response:** `200 OK`
```json
{
  "token": "string",
  "url": "string",
  "is_enabled": true
}
```

#### Disable Share Link
```http
DELETE /share/collections/{collection_id}
```

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "status": "disabled"
}
```

## Contact

### Endpoints

#### Submit Contact Form
```http
POST /contact/
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Contact form submitted successfully",
  "rate_limit": {
    "remaining_requests": 2,
    "window_reset": 1640995200
  }
}
```

**Errors:**
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Email configuration error

#### Get Rate Limit Info
```http
GET /contact/rate-limit-info
```

**Response:** `200 OK`
```json
{
  "remaining_requests": 3,
  "max_requests": 3,
  "window_seconds": 3600
}
```

## Data Models

### User
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "created_date": "datetime",
  "updated_date": "datetime"
}
```

### Collection
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "owner_id": "integer",
  "collection_order": "integer",
  "created_date": "datetime",
  "updated_date": "datetime",
  "items": "Item[]"
}
```

### Item
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "collection_id": "integer",
  "item_order": "integer",
  "created_date": "datetime",
  "updated_date": "datetime",
  "images": "ItemImage[]",
  "tags": "Tag[]"
}
```

### ItemImage
```json
{
  "id": "integer",
  "image_url": "string",
  "item_id": "integer",
  "image_order": "integer",
  "created_date": "datetime",
  "updated_date": "datetime"
}
```

### Tag
```json
{
  "id": "integer",
  "name": "string"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

```json
{
  "detail": "Error message description"
}
```

### Common Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content returned
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | - |
| `SECRET_KEY` | JWT secret key (min 32 chars) | Yes | - |
| `ALGORITHM` | JWT signing algorithm | No | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | No | 30 |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Refresh token lifetime | No | 10080 |
| `HOST` | Server host | No | 0.0.0.0 |
| `PORT` | Server port | No | 8000 |
| `CORS_ORIGINS` | Allowed CORS origins | No | http://localhost:5173 |
| `UPLOAD_DIR` | File upload directory | No | backend/uploads |
| `MAX_FILE_SIZE` | Maximum file size in bytes | No | 10485760 |
| `ALLOWED_EXTENSIONS` | Allowed file extensions | No | .jpg,.jpeg,.png,.gif,.webp |
| `API_BASE_URL` | Base URL for API | No | http://localhost:8000 |
| `SMTP_SERVER` | SMTP server for emails | No | smtp.gmail.com |
| `SMTP_PORT` | SMTP server port | No | 587 |
| `SMTP_USERNAME` | SMTP username | No | - |
| `SMTP_PASSWORD` | SMTP password | No | - |
| `ADMIN_EMAIL` | Admin email for notifications | No | - |
| `RATE_LIMIT_MAX_REQUESTS` | Max contact form requests | No | 3 |
| `RATE_LIMIT_WINDOW_SECONDS` | Rate limit window | No | 3600 |

### File Upload Configuration

- **Maximum file size**: 10MB
- **Allowed formats**: JPG, JPEG, PNG, GIF, WEBP
- **Automatic compression**: Images are automatically compressed if they exceed the size limit
- **Storage**: Files are stored locally in the configured upload directory

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Contact form rate limiting to prevent spam
- **Input Validation**: Comprehensive request validation using Pydantic

### Development vs Production

**Development:**
- Uses local file storage for images
- Debug logging enabled
- Relaxed CORS settings

**Production Considerations:**
- Use cloud storage (AWS S3, Google Cloud Storage) for images
- Configure proper SMTP settings for email notifications
- Set up proper CORS origins
- Use environment-specific database URLs
- Enable HTTPS
- Configure proper logging and monitoring

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Testing

The API includes comprehensive test coverage:

```bash
# Run all tests
poetry run pytest backend/tests

# Run specific test file
poetry run pytest backend/tests/test_auth.py -v

# Run with coverage
poetry run pytest backend/tests --cov=backend
```

## Support

For questions or issues with the API, please contact the development team or submit an issue through the project repository.
