# Rate Limiting - Quick Reference

## 🚀 Quick Start

### Check if Endpoint is Rate Limited
```php
php artisan route:list | grep throttle
```

### Test Rate Limit (5 requests/min for login)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"; sleep 0.5
done
```

**Expected**: Requests 1-5 fail (422), request 6 blocked (429)

---

## 📋 Endpoint Limits at a Glance

| Endpoint | Limit | Type |
|----------|-------|------|
| POST `/api/login` | 5/min | Security |
| POST `/api/register` | 3/min | Security |
| GET `/api/verify-email/{id}/{hash}` | 10/min | Flexible |
| POST `/api/email/verification-notification` | 3/min | Security |
| POST `/api/forgot-password` | 3/min | Security |
| POST `/api/reset-password` | 3/min | Security |
| POST `/api/check-email` | 10/min | Flexible |

---

## 🔧 Common Tasks

### Increase Rate Limit for Login
Edit `.env`:
```env
RATE_LIMIT_LOGIN=10,1  # Changed from 5,1 to 10,1
```
Then: `php artisan config:cache`

### Whitelist Your IP
Edit `.env`:
```env
RATE_LIMIT_EXCEPTIONS=127.0.0.1,::1,YOUR_IP
```

### Clear All Rate Limits
```bash
php artisan cache:clear
```

### Clear Specific Endpoint
```php
php artisan tinker
Cache::forget('rate_limit:login:192.168.1.100');
```

### Check Rate Limit Status
```php
php artisan tinker
use App\Services\RateLimitService;
$s = app(RateLimitService::class);
$s->remaining(request(), 'login');  // Remaining requests
$s->isLimited(request(), 'login');  // Is limited?
```

---

## 🌐 Frontend Handling

### Axios Interceptor
```typescript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      const wait = error.response.headers['retry-after'];
      toast.error(`Too many requests. Wait ${wait}s`);
    }
    return Promise.reject(error);
  }
);
```

### React Hook
```typescript
const { isLimited, countdown } = useRateLimit();

<button disabled={isLimited}>
  {isLimited ? `Wait ${countdown}s` : 'Submit'}
</button>
```

---

## 🔍 Response Headers

When rate limited (HTTP 429):
```
Retry-After: 45           # Seconds to wait
X-RateLimit-Limit: 5      # Max requests
X-RateLimit-Remaining: 0  # Requests left
X-RateLimit-Reset: 1735589400  # Unix timestamp
```

---

## 📊 Monitoring

### View All Rate Limits
```sql
SELECT key, value, expires_at FROM cache 
WHERE key LIKE 'rate_limit:%' 
ORDER BY expires_at DESC;
```

### Monitor High Activity
```bash
tail -f storage/logs/laravel.log | grep "429\|rate_limit"
```

### Get Stats
```php
DB::table('cache')
  ->where('key', 'like', 'rate_limit:%')
  ->count();  // Total active rate limits
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Rate limits not working | `php artisan cache:clear` |
| Users getting blocked | Increase limit in `.env` + restart |
| Can't test due to limits | Add IP to `RATE_LIMIT_EXCEPTIONS` |
| High cache usage | Switch to Redis in `.env` |
| Limits not resetting | Check cache table TTL |

---

## 📦 Files Location

| File | Purpose |
|------|---------|
| `config/ratelimit.php` | Configuration |
| `app/Services/RateLimitService.php` | Service class |
| `routes/auth.php` | Throttle middleware |
| `.env` | Environment variables |

---

## 🔐 Security Note

**Never disable rate limiting in production!** It protects against:
- Brute-force password attacks
- Account enumeration
- Password reset spam
- Registration spam
- API abuse

---

## 📖 Full Documentation

- **Setup**: See `RATE_LIMITING.md`
- **Testing**: See `TESTING_RATE_LIMITS.md`
- **Frontend**: See `FRONTEND_RATE_LIMIT_INTEGRATION.md`
- **Details**: See `RATE_LIMITING_COMPLETE_SUMMARY.md`

---

## 💻 Developer Commands

```bash
# Check configuration
php artisan config:show ratelimit.limits

# View routes with limits
php artisan route:list --name auth

# Clear cache
php artisan cache:clear

# Monitor logs
tail -f storage/logs/laravel.log

# Interactive shell
php artisan tinker
```

---

## ✅ Pre-Deploy Checklist

- [ ] Rate limits configured per environment
- [ ] Redis running (if using Redis store)
- [ ] Frontend handles 429 responses
- [ ] Retry-After headers implemented
- [ ] Logging enabled for monitoring
- [ ] Test endpoints within limits
- [ ] Test 429 response handling
- [ ] Documentation reviewed
- [ ] Edge cases tested

