# Rate Limiting & Brute-Force Protection

## Overview

This application implements comprehensive rate limiting and brute-force protection across all sensitive endpoints using Laravel's built-in throttle middleware with configurable limits per IP address.

## Configuration

### Environment Variables (.env)

```dotenv
# Rate Limiting Configuration (requests per minute)
RATE_LIMIT_LOGIN=5,1           # Login: 5 attempts per minute
RATE_LIMIT_REGISTER=3,1        # Register: 3 attempts per minute  
RATE_LIMIT_SEARCH=100,1        # Search: 100 requests per minute
RATE_LIMIT_API=60,1            # General API: 60 requests per minute

# Rate Limit Store (uses database by default)
RATE_LIMIT_STORE=database      # Options: database, redis, memcached, file

# Exclude IPs from rate limiting (development/testing)
RATE_LIMIT_EXCEPTIONS=127.0.0.1,::1
```

### Config File (config/ratelimit.php)

Define custom limits for different endpoints:

```php
'limits' => [
    'login' => '5,1',              // 5 requests per 1 minute
    'register' => '3,1',           // 3 requests per 1 minute
    'verify_email' => '10,1',      // 10 requests per 1 minute
    'api' => '60,1',               // 60 requests per 1 minute
    'search' => '100,1',           // 100 requests per 1 minute
],
```

## Protected Endpoints

### Authentication Endpoints

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `POST /api/register` | 3/min | Prevent rapid account creation |
| `POST /api/login` | 5/min | Prevent brute-force login attacks |
| `POST /api/forgot-password` | 3/min | Prevent spam password resets |
| `POST /api/reset-password` | 3/min | Prevent rapid password changes |
| `POST /api/check-email` | 10/min | Prevent email enumeration |

### Email Verification

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `GET /api/verify-email/{id}/{hash}` | 10/min | Prevent verification link spam |
| `POST /api/email/verification-notification` | 3/min | Prevent resend spam |

## How It Works

### Per-IP Rate Limiting

Each endpoint tracks requests by **IP address**. When a client exceeds the limit:

1. **Immediate Response**: Returns HTTP 429 (Too Many Requests)
2. **Error Message**: "Too many requests. Please try again in X seconds."
3. **Headers Added**:
   - `X-RateLimit-Limit`: Maximum requests allowed
   - `X-RateLimit-Remaining`: Requests remaining
   - `X-RateLimit-Reset`: Unix timestamp when limit resets
   - `Retry-After`: Seconds to wait before retrying

### Example Response

```json
{
  "success": false,
  "message": "Too many requests. Please try again in 45 seconds.",
  "retry_after": 45
}
```

With Headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735589400
Retry-After: 45
```

## Usage Examples

### In Controllers

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Services\RateLimitService;
use Illuminate\Http\Request;

class LoginController
{
    public function __invoke(Request $request, RateLimitService $rateLimiter)
    {
        // Check if rate limited
        if ($rateLimiter->isLimited($request, 'login')) {
            return response()->json([
                'message' => 'Too many login attempts. Try again in ' . 
                             $rateLimiter->retryAfter($request, 'login') . ' seconds'
            ], 429);
        }

        // Record attempt
        $rateLimiter->recordAttempt($request, 'login');

        // ... authentication logic
    }
}
```

### In Routes

Routes are already configured in `routes/auth.php`:

```php
Route::post('login', [AuthenticatedSessionController::class, 'store'])
    ->middleware(['guest', 'throttle:5,1'])
    ->name('login');
```

Format: `throttle:max_requests,decay_minutes`

## Client-Side Handling

### Frontend Implementation

```typescript
// In your API client/axios interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = error.response.data?.message;
      
      // Show user-friendly message
      toast.error(`${message}`);
      
      // Disable form for retry-after seconds
      setFormDisabled(true);
      setTimeout(() => setFormDisabled(false), retryAfter * 1000);
    }
    return Promise.reject(error);
  }
);
```

## Monitoring & Debugging

### Check Rate Limit Status

```php
// In tinker or controller
use App\Services\RateLimitService;

$service = app(RateLimitService::class);
$request = request();

// Check remaining requests
$remaining = $service->remaining($request, 'login');

// Check if limited
$isLimited = $service->isLimited($request, 'login');

// Get retry after seconds
$retryAfter = $service->retryAfter($request, 'login');

// Clear limit (useful for testing)
$service->clear($request, 'login');
```

### Log Rate Limit Attempts

Add to `.env`:
```
LOG_LEVEL=debug
```

Rate limit events will appear in `storage/logs/laravel.log`

## Excluding IPs from Rate Limiting

For development/testing, exclude localhost and specific IPs:

```dotenv
RATE_LIMIT_EXCEPTIONS=127.0.0.1,::1,192.168.1.100
```

These IPs will bypass all rate limiting.

## Security Best Practices

### 1. **Adjust Limits Based on Usage**
   - Monitor failed login attempts
   - Adjust limits if users complain
   - Keep logs for security analysis

### 2. **Monitor for Attacks**
   - Check logs for repeated 429 responses
   - Set up alerts for multiple rate limit violations
   - Block IPs with sustained attack patterns

### 3. **Combine with Other Defenses**
   - CAPTCHA after N failed login attempts
   - Account lockout after repeated failures
   - Email notifications for suspicious activity

### 4. **Use Redis for Production**
   ```dotenv
   RATE_LIMIT_STORE=redis
   ```
   More efficient than database for high-traffic applications

## Common Issues & Solutions

### Issue: Legitimate users get rate limited

**Cause**: Limit too strict, shared IP (office, VPN)

**Solution**:
- Increase limit: `RATE_LIMIT_LOGIN=10,1`
- Whitelist IP: Add to `RATE_LIMIT_EXCEPTIONS`
- Use user-based limit instead of IP (future enhancement)

### Issue: Rate limiting not working

**Cause**: Cache not properly configured

**Solution**:
1. Check cache driver: `php artisan config:cache`
2. Clear cache: `php artisan cache:clear`
3. Verify database: `php artisan tinker` → `Cache::store('database')->put('test', 'value')`

## Future Enhancements

1. **User-based Rate Limiting**: Limit per user instead of IP
2. **Dynamic Limits**: Adjust based on failure patterns
3. **Graduated Delays**: Exponentially increase wait time with repeated violations
4. **CAPTCHA Integration**: Trigger CAPTCHA after N failed attempts
5. **IP Reputation**: Block known malicious IPs
6. **Analytics Dashboard**: Real-time rate limit monitoring

## Testing Rate Limits

```bash
# Test login rate limit (5 requests per minute)
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done

# 6th request should return 429
```

## References

- [Laravel Rate Limiting](https://laravel.com/docs/11.x/routing#rate-limiting)
- [HTTP 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [Retry-After Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
