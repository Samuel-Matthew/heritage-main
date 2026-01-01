# Rate Limit JSON Response - Troubleshooting

## ❓ Common Questions & Answers

### Q1: Will users see HTML errors instead of JSON?

**A:** No! ✅ The `HandleRateLimitJson` middleware guarantees all rate limit errors (HTTP 429) are returned as JSON.

### Q2: What if the middleware isn't working?

**A:** Check that it's registered in `bootstrap/app.php`:
```php
$middleware->api(prepend: [
    \App\Http\Middleware\HandleRateLimitJson::class,  // Must be here
]);
```

### Q3: Can I test the JSON response?

**A:** Yes! Use curl:
```bash
# Trigger 6+ login attempts to get 429
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i  # Shows headers and body
done

# 6th request will show:
# HTTP/1.1 429 Too Many Requests
# Content-Type: application/json
# Retry-After: 60
# 
# {"success":false,"message":"Too many requests..."}
```

### Q4: What if I get JSON parse error in console?

**A:** This means the middleware isn't catching the exception. Check:
1. Is middleware registered in `bootstrap/app.php`? ✓
2. Did you clear cache? Run: `php artisan config:cache`
3. Is throttle middleware on the route? ✓

### Q5: The response looks good, but frontend still fails?

**A:** Make sure your API client is checking `error.response?.status === 429`:
```typescript
// In src/lib/api.ts
if (error.response?.status === 429) {
  const rateLimitError = new Error(message) as any;
  rateLimitError.isRateLimited = true;
  return Promise.reject(rateLimitError);
}
```

---

## 🔍 Debugging Steps

### Step 1: Verify Middleware is Registered

```bash
php artisan tinker
```

```php
# Check if middleware is registered
$app = app();
$middleware = $app->make(\Illuminate\Foundation\Http\Kernel::class);
print_r(get_class_methods($middleware));

# Or directly check bootstrap/app.php file:
cat bootstrap/app.php | grep HandleRateLimitJson
```

### Step 2: Check Route Throttle Middleware

```bash
php artisan route:list | grep login
```

**Should show:**
```
POST      api/login         ... middleware: guest,throttle:5,1 ...
```

### Step 3: Test Directly with curl

```bash
# Single request to see headers
curl -v -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# Look for:
# < HTTP/1.1 429 Too Many Requests
# < Content-Type: application/json
# < Retry-After: 60
```

### Step 4: Test from Browser

```javascript
// In browser console
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
})
.then(r => r.json())  // Will work because response is JSON
.then(d => console.log(d))
.catch(e => console.error(e));
```

### Step 5: Check Cache

```php
php artisan tinker
use Illuminate\Support\Facades\Cache;

# See all rate limit keys
DB::table('cache')
  ->where('key', 'like', 'rate_limit:%')
  ->get();

# Clear all (if stuck)
Cache::flush();
```

---

## 🐛 Common Issues & Fixes

### Issue: Still Getting HTML Error Pages

**Cause:** Middleware not registered or not catching exception properly

**Fix:**
```bash
# 1. Clear config cache
php artisan config:cache
php artisan cache:clear

# 2. Verify middleware in bootstrap/app.php
# Look for: \App\Http\Middleware\HandleRateLimitJson::class

# 3. Check if middleware file exists
ls app/Http/Middleware/HandleRateLimitJson.php

# 4. Restart server
php artisan serve
```

### Issue: Content-Type is text/html

**Cause:** Middleware might not be prepending correctly

**Fix:**
```php
// In bootstrap/app.php, use prepend:
$middleware->api(prepend: [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \App\Http\Middleware\HandleRateLimitJson::class,  // Must be here
]);
```

### Issue: JSON is null or empty

**Cause:** Exception isn't being caught

**Fix:**
```php
// Verify middleware catches the right exception
catch (TooManyRequestsHttpException $exception)  // Correct class name
```

### Issue: Retry-After header missing

**Cause:** Not reading from exception headers

**Fix:**
```php
// In middleware:
$retryAfter = $exception->getHeaders()['Retry-After'] ?? 60;
```

---

## ✅ Verification Checklist

Run through these to ensure everything is working:

- [ ] File exists: `app/Http/Middleware/HandleRateLimitJson.php`
- [ ] Middleware registered in `bootstrap/app.php`
- [ ] Throttle middleware on auth routes: `throttle:5,1`
- [ ] Cache is cleared: `php artisan cache:clear`
- [ ] Config is cached: `php artisan config:cache`
- [ ] Server restarted: `php artisan serve`

**Test:**
```bash
# Trigger rate limit
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\nContent-Type: %{content_type}\n\n"
  sleep 0.5
done

# 6th response should show:
# Status: 429
# Content-Type: application/json
# {"success":false,"message":"Too many requests..."}
```

---

## 🔐 Security Verification

### Verify Rate Limiting is Actually Working

```bash
# 1. Make 7 login attempts rapidly
for i in {1..7}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.1
done

# Expected:
# Status: 422 (validation error)
# Status: 422
# Status: 422
# Status: 422
# Status: 422
# Status: 429 ← RATE LIMITED
# Status: 429
```

### Verify Different IPs Have Separate Limits

```bash
# From one IP
curl -X POST http://localhost:8000/api/login \
  -H "X-Forwarded-For: 1.1.1.1" ...

# From another IP
curl -X POST http://localhost:8000/api/login \
  -H "X-Forwarded-For: 2.2.2.2" ...

# Each should have independent rate limit count
```

---

## 🔧 Manual Testing Script

Save this as `test-rate-limit.sh`:

```bash
#!/bin/bash

echo "Testing Rate Limit Responses..."
echo "================================"

# Test login endpoint (5/min limit)
echo ""
echo "Testing: POST /api/login (limit: 5/min)"
echo "Making 6 requests (6th should return 429)..."
echo ""

for i in {1..6}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n" \
    -i | head -n 10
  echo "---"
  sleep 0.5
done

echo ""
echo "Test Complete!"
echo "Expected: Requests 1-5 show 422, Request 6 shows 429"
```

Run with:
```bash
chmod +x test-rate-limit.sh
./test-rate-limit.sh
```

---

## 📞 If Still Having Issues

1. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Enable debug mode:**
   ```env
   APP_DEBUG=true
   ```

3. **Check middleware is loaded:**
   ```bash
   php artisan config:show middleware
   ```

4. **Verify exception handling:**
   ```php
   php artisan tinker
   $e = new \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException(60);
   echo get_class($e);  # Should output: Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException
   ```

5. **Manual test:**
   ```bash
   # Start fresh
   php artisan cache:clear
   php artisan config:cache
   php artisan serve
   
   # Then test
   curl -X POST http://localhost:8000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"wrong"}'
   ```

---

## ✨ Success Indicators

When everything is working correctly, you'll see:

```
✅ HTTP 429 responses returned (not 404 or 500)
✅ Content-Type: application/json header present
✅ Response body is valid JSON (can parse with .json())
✅ Retry-After header included
✅ Frontend receives error with isRateLimited = true
✅ Countdown timer starts automatically
✅ Form disables during cooldown
✅ Form re-enables after countdown expires
```

---

## 🎯 TL;DR

**Q: Will users see confusing JSON errors?**

**A:** No! We have:
1. ✅ Middleware that catches rate limit exceptions
2. ✅ Returns proper JSON responses  
3. ✅ Frontend parses errors safely
4. ✅ Shows friendly countdown timer

**Everything is secure and user-friendly!**

