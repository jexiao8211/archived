# Rate Limiting for Contact Form

## Overview

The contact form now includes rate limiting to prevent spam and abuse. This implementation uses IP-based rate limiting with a sliding window approach.

## Configuration

Rate limiting settings can be configured via environment variables:

```bash
# Maximum contact form submissions per time window
RATE_LIMIT_MAX_REQUESTS=3

# Time window in seconds (default: 1 hour)
RATE_LIMIT_WINDOW_SECONDS=3600
```

## How It Works

### Backend Implementation

1. **IP Detection**: The system extracts the client IP from various headers:
   - `X-Forwarded-For` (for proxy setups)
   - `X-Real-IP` (for load balancers)
   - Client host (fallback)

2. **Rate Limiting Logic**:
   - Each IP is allowed `RATE_LIMIT_MAX_REQUESTS` submissions per `RATE_LIMIT_WINDOW_SECONDS`
   - Uses a sliding window approach (resets after the time window expires)
   - In-memory storage (can be upgraded to Redis for production)

3. **Error Handling**:
   - Returns HTTP 429 (Too Many Requests) when limit exceeded
   - Includes helpful error message with retry time
   - Provides rate limit information in successful responses

### Frontend Implementation

1. **Error Handling**: The frontend specifically handles 429 errors and displays user-friendly messages
2. **User Feedback**: Shows clear messages about rate limit exceeded and when to retry

## API Endpoints

### POST `/contact/`
Submit a contact form.

**Rate Limited**: Yes
**Response on Success**:
```json
{
  "message": "Contact form submitted successfully",
  "rate_limit": {
    "remaining_requests": 2,
    "window_reset": 1640995200
  }
}
```

**Response on Rate Limit Exceeded**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many contact form submissions. Please try again in 45 minutes.",
  "retry_after": 2700
}
```

### GET `/contact/rate-limit-info`
Get current rate limit information for the client.

**Response**:
```json
{
  "remaining_requests": 3,
  "max_requests": 3,
  "window_seconds": 3600
}
```

## Testing

Run the rate limiting tests:

```bash
cd backend
pytest tests/test_contact.py -v
```

## Production Considerations

### Current Implementation (Development)
- In-memory storage (resets on server restart)
- Single server only
- Simple but effective for small applications

### Production Upgrades
1. **Redis Storage**: Replace in-memory storage with Redis for persistence across restarts
2. **Distributed Rate Limiting**: Use Redis for multi-server deployments
3. **More Sophisticated Rules**: 
   - Different limits for different user types
   - Email-based rate limiting in addition to IP
   - CAPTCHA integration for repeated violations

### Example Redis Implementation
```python
import redis
from datetime import datetime

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def check_rate_limit_redis(ip_address: str) -> bool:
    key = f"rate_limit:{ip_address}"
    current_count = redis_client.get(key)
    
    if current_count and int(current_count) >= RATE_LIMIT_MAX_REQUESTS:
        return True  # Rate limit exceeded
    
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, RATE_LIMIT_WINDOW_SECONDS)
    pipe.execute()
    
    return False
```

## Security Notes

- Rate limiting is based on IP address, which can be bypassed with VPNs/proxies
- Consider additional measures for high-security applications:
  - Email verification before allowing contact form submission
  - CAPTCHA integration
  - Account-based rate limiting for registered users
  - Monitoring and alerting for unusual patterns

## Monitoring

Monitor rate limiting effectiveness:
- Track 429 responses in your logs
- Monitor IP addresses that frequently hit rate limits
- Consider implementing alerting for unusual patterns 