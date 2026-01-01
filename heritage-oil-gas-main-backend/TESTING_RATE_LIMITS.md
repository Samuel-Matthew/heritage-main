# Testing & Monitoring Rate Limits

## Quick Testing Guide

### Using curl to Test Rate Limits

#### Test Login Rate Limit (5/min)

```bash
# Create a test script to exceed login limit
for i in {1..7}; do
  echo "Request $i:"
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n" \
    -s | jq .
  sleep 0.5
done
```

**Expected Result:**
- Requests 1-5: Status 422 (validation error, but rate limit not hit)
- Request 6-7: Status **429 Too Many Requests**

#### Test Registration Rate Limit (3/min)

```bash
# Test registration limit
for i in {1..5}; do
  echo "Request $i:"
  curl -X POST http://localhost:8000/api/register \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{
      "name":"Test User '$i'",
      "email":"test'$i'@example.com",
      "password":"Password123!",
      "password_confirmation":"Password123!"
    }' \
    -w "\nStatus: %{http_code}\n" \
    -s | jq .
  sleep 0.5
done
```

**Expected Result:**
- Requests 1-3: Status 201 or 422 (depending on validation)
- Request 4-5: Status **429 Too Many Requests**

#### Test Email Check Rate Limit (10/min)

```bash
# Test email check endpoint
for i in {1..12}; do
  echo "Request $i:"
  curl -X POST http://localhost:8000/api/check-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' \
    -w "\nStatus: %{http_code}\n" \
    -s | jq .
  sleep 0.2
done
```

**Expected Result:**
- Requests 1-10: Status 200 OK
- Request 11-12: Status **429 Too Many Requests**

### Using Python for Batch Testing

```python
import requests
import time
import json

BASE_URL = "http://localhost:8000/api"

def test_endpoint(endpoint, method, data, limit, test_name):
    """Test an endpoint's rate limiting"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name} (Limit: {limit} requests/min)")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/{endpoint}"
    
    for i in range(limit + 2):
        try:
            if method == 'POST':
                response = requests.post(
                    url,
                    json=data,
                    headers={'Accept': 'application/json'},
                    timeout=5
                )
            else:
                response = requests.get(url, timeout=5)
            
            status = response.status_code
            color = '\033[92m' if status < 429 else '\033[91m'  # Green or Red
            reset = '\033[0m'
            
            print(f"Request {i+1}: {color}Status {status}{reset}", end="")
            
            # Show rate limit headers
            if 'X-RateLimit-Remaining' in response.headers:
                remaining = response.headers.get('X-RateLimit-Remaining')
                print(f" | Remaining: {remaining}", end="")
            
            if status == 429:
                retry_after = response.headers.get('Retry-After', 'N/A')
                print(f" | Retry-After: {retry_after}s")
            else:
                print()
            
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Request {i+1}: Error - {str(e)}")

# Test configurations
tests = [
    {
        'endpoint': 'login',
        'method': 'POST',
        'data': {'email': 'test@example.com', 'password': 'wrong'},
        'limit': 5,
        'name': 'Login Endpoint (5/min)'
    },
    {
        'endpoint': 'check-email',
        'method': 'POST',
        'data': {'email': 'test@example.com'},
        'limit': 10,
        'name': 'Email Check Endpoint (10/min)'
    },
]

# Run tests
for test in tests:
    test_endpoint(
        test['endpoint'],
        test['method'],
        test['data'],
        test['limit'],
        test['name']
    )
```

## Monitoring Rate Limits

### Check Rate Limit Status in Real-Time

#### Using Laravel Tinker

```bash
php artisan tinker
```

```php
# Check rate limit for a specific IP
use Illuminate\Cache\CacheManager;
use App\Services\RateLimitService;

$service = app(RateLimitService::class);

# Create a mock request
$request = request();
$request->server->set('REMOTE_ADDR', '192.168.1.100');

# Check status
$service->isLimited($request, 'login')              // true/false
$service->remaining($request, 'login')              // Number of remaining requests
$service->retryAfter($request, 'login')             // Seconds until reset

# Clear rate limit (useful for testing)
$service->clear($request, 'login');
```

### View Rate Limit Data in Cache

```php
# In tinker
use Illuminate\Support\Facades\Cache;

# List all rate limit keys
Cache::store('database')->getStore()->connection()->getConnection()->table('cache')
    ->where('key', 'like', 'rate_limit:%')
    ->get();

# Get specific IP's rate limit
Cache::get('rate_limit:login:192.168.1.100');  // Returns count or null
```

### Monitor with Logs

Add logging to `routes/auth.php` or create middleware:

```php
// In routes/auth.php middleware
Route::post('login', [AuthenticatedSessionController::class, 'store'])
    ->middleware([
        'guest',
        'throttle:5,1',
        function ($request, $next) {
            // Log rate limit info
            \Log::info('Login attempt', [
                'ip' => $request->ip(),
                'email' => $request->input('email'),
                'timestamp' => now(),
            ]);
            return $next($request);
        }
    ])
    ->name('login');
```

View logs:
```bash
tail -f storage/logs/laravel.log | grep "Login attempt"
```

## Advanced Testing

### Test Rate Limiting Across Different IPs

```php
// Spoof different IPs
$headers = [
    'X-Forwarded-For' => '192.168.1.100',  // Set IP to test
];

curl -X POST http://localhost:8000/api/login \
  -H "X-Forwarded-For: 192.168.1.100" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -w "\nStatus: %{http_code}\n"
```

### Check Rate Limit Reset Time

```bash
# After getting 429, check when it resets
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -i

# Look for:
# HTTP/1.1 429 Too Many Requests
# Retry-After: 45
# X-RateLimit-Reset: 1735589400
```

## Debugging Rate Limit Issues

### Problem: Rate limits not working

1. **Check Redis Connection:**
   ```bash
   redis-cli ping
   # Should return PONG
   ```

2. **Verify Cache Configuration:**
   ```php
   php artisan tinker
   Cache::store('database')->put('test_key', 'test_value', 60);
   Cache::get('test_key');  // Should return 'test_value'
   ```

3. **Check Throttle Middleware:**
   ```bash
   php artisan route:list | grep throttle
   ```

### Problem: Development IP Always Rate Limited

**Solution:** Add your IP to exceptions in `.env`:
```dotenv
RATE_LIMIT_EXCEPTIONS=127.0.0.1,::1,YOUR_IP_ADDRESS
```

### Problem: All Requests Getting 429

**Possible Causes:**
1. Cache store is full or corrupted
2. Rate limit key naming is wrong
3. Throttle middleware misconfigured

**Solutions:**
```bash
# Clear all cache
php artisan cache:clear

# Check which cache store is being used
php artisan config:show cache.default

# Reset a specific endpoint's rate limits
php artisan cache:forget "rate_limit:login:192.168.1.*"

# View cache table directly
php artisan tinker
DB::table('cache')->where('key', 'like', 'rate_limit:%')->delete();
```

## Production Monitoring

### Set Up Alerts

Create a job to monitor rate limit violations:

```php
// app/Jobs/MonitorRateLimits.php
namespace App\Jobs;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MonitorRateLimits
{
    public function handle()
    {
        $limits = Cache::store('database')->getStore()->connection()
            ->getConnection()->table('cache')
            ->where('key', 'like', 'rate_limit:%')
            ->get();

        foreach ($limits as $limit) {
            // Alert if high frequency
            if ($limit->value > 50) {
                Log::warning('High rate limit activity', [
                    'key' => $limit->key,
                    'count' => $limit->value,
                ]);
            }
        }
    }
}
```

### View Rate Limit Analytics

Add to a dashboard:

```php
// In controller
public function rateLimitStats()
{
    $stats = Cache::store('database')->getStore()->connection()
        ->getConnection()->table('cache')
        ->where('key', 'like', 'rate_limit:%')
        ->selectRaw('key, value, count(*) as total')
        ->groupBy('key', 'value')
        ->get();

    return response()->json($stats);
}
```

## Resetting Rate Limits

### Clear All Rate Limits

```bash
php artisan cache:clear
```

### Clear Specific Endpoint

```php
php artisan tinker
use Illuminate\Support\Facades\Cache;
Cache::tags('rate_limit')->flush();  // If using tags
Cache::forget('rate_limit:login:*');  // Wildcard clear
```

### Clear Specific IP

```php
// For a single IP
use Illuminate\Support\Facades\Cache;
Cache::forget('rate_limit:login:192.168.1.100');
Cache::forget('rate_limit:register:192.168.1.100');
```

## Response Examples

### Successful Request (Within Limit)

```bash
Status: 422 Unprocessable Entity

Headers:
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1735589400

Response:
{
  "message": "The given data was invalid.",
  "errors": {...}
}
```

### Rate Limit Exceeded

```bash
Status: 429 Too Many Requests

Headers:
Retry-After: 45
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735589400

Response:
{
  "message": "Too many requests. Please try again in 45 seconds."
}
```

## Performance Impact

### Cache Usage

Rate limits use minimal cache:
- **Per endpoint/IP**: ~50 bytes
- **100 concurrent IPs × 10 endpoints**: ~50 KB
- **1M IPs over 24 hours (with cleanup)**: ~50 MB

### Recommendations

| Traffic Level | Recommended Store | Notes |
|---|---|---|
| Low (<1000 req/min) | database | Simple, no extra infrastructure |
| Medium (1k-10k req/min) | redis | Better performance |
| High (>10k req/min) | redis cluster | Scalability required |

