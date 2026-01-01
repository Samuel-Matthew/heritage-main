# Rate Limiting - Visual Quick Reference

## 🎯 The Answer to Your Question

```
┌─────────────────────────────────────────────────────────┐
│ Q: Will errors be in JSON for users?                    │
├─────────────────────────────────────────────────────────┤
│ A: YES, errors are in JSON format, but users            │
│    will see a friendly countdown timer,                 │
│    NOT raw JSON in the interface.                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 What Users Will See

### ✅ Login After 5 Attempts (Success)
```
┌────────────────────────────────┐
│  LOGIN FORM                    │
├────────────────────────────────┤
│  Email: user@example.com       │
│  Password: ••••••••••          │
│                                │
│  [  LOGIN BUTTON (Enabled)  ]  │
└────────────────────────────────┘
```

### ❌ Attempt 6+ (Rate Limited)
```
┌────────────────────────────────┐
│  LOGIN FORM                    │
├────────────────────────────────┤
│  Email: user@example.com       │
│  Password: ••••••••••          │
│                                │
│  ┌──────────────────────────┐  │
│  │ ⚠️  Too many attempts    │  │
│  │ Try again in 45 seconds  │  │
│  └──────────────────────────┘  │
│                                │
│  [LOGIN BUTTON (Disabled) ]    │
│                                │
│  ⏱️  45s remaining ⏳           │
└────────────────────────────────┘

After countdown completes:
│  [  LOGIN BUTTON (Re-enabled)  ] │
```

---

## 🔄 The Complete Flow

```
┌──────────────────────────────────────────────────────────┐
│ USER EXPERIENCE                                          │
└──────────────────────────────────────────────────────────┘

Attempt 1 → ✓ Login Form Works
Attempt 2 → ✓ Login Form Works
Attempt 3 → ✓ Login Form Works
Attempt 4 → ✓ Login Form Works
Attempt 5 → ✓ Login Form Works
Attempt 6 → ❌ Rate Limited!
            ↓
            Shows: "Too many attempts. Wait 45s"
            Button: Disabled
            Countdown: 45 → 44 → 43 ... → 1 → 0
            ↓
            After timeout:
            Button: Re-enabled ✓

            User can try again
```

---

## 📊 HTTP Response Details

### Successful Login (HTTP 200)
```
┌─────────────────────────────────────────────┐
│ HTTP 200 OK                                 │
│ Content-Type: application/json              │
├─────────────────────────────────────────────┤
│ {                                           │
│   "success": true,                          │
│   "user": {                                 │
│     "id": 1,                                │
│     "email": "user@example.com",            │
│     "name": "John Doe"                      │
│   }                                         │
│ }                                           │
└─────────────────────────────────────────────┘
```

### Rate Limited (HTTP 429)
```
┌──────────────────────────────────────────────────┐
│ HTTP 429 Too Many Requests                       │
│ Content-Type: application/json                   │
│ Retry-After: 60                                  │
├──────────────────────────────────────────────────┤
│ {                                                │
│   "success": false,                              │
│   "message": "Too many requests. Please try      │
│              again in 60 seconds."               │
│ }                                                │
└──────────────────────────────────────────────────┘
```

### Validation Error (HTTP 422)
```
┌──────────────────────────────────────────────────┐
│ HTTP 422 Unprocessable Entity                    │
│ Content-Type: application/json                   │
├──────────────────────────────────────────────────┤
│ {                                                │
│   "success": false,                              │
│   "message": "The given data was invalid.",      │
│   "errors": {                                    │
│     "email": [                                   │
│       "The email field is required."             │
│     ]                                            │
│   }                                              │
│ }                                                │
└──────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### Where JSON Guarantee Comes From

```
User Request
    ↓
Laravel Routes → Throttle Middleware
    ↓
Too Many Requests?
    ├─ NO  → Process normally
    └─ YES → Throw TooManyRequestsHttpException
            ↓
            HandleRateLimitJson Middleware CATCHES it
            ↓
            return response()->json([
              'success' => false,
              'message' => 'Too many requests...'
            ], 429, [
              'Retry-After' => 60,
              'Content-Type' => 'application/json'  ← GUARANTEED
            ])
            ↓
HTTP 429 (JSON) Response
```

---

## 💻 Code Integration Points

### Frontend Hook Usage

```typescript
┌─────────────────────────────────────────┐
│ import { useRateLimit }                 │
│   from '@/hooks/useRateLimit'           │
├─────────────────────────────────────────┤
│ const {                                 │
│   isLimited,              ← true/false │
│   countdown,              ← 60,45,30... │
│   message,                ← error text  │
│   handleRateLimitError,   ← function   │
│   resetRateLimit          ← function   │
│ } = useRateLimit();                     │
└─────────────────────────────────────────┘
```

### Error Handling

```typescript
┌──────────────────────────────────────────────────┐
│ try {                                            │
│   await api.post('/login', data)                 │
│ } catch (error: any) {                           │
│   if (error.isRateLimited) {  ← Check this flag │
│     handleRateLimitError(                        │
│       error.retryAfter,   // 60                  │
│       error.message       // "Too many..."       │
│     );                                           │
│   }                                              │
│ }                                                │
└──────────────────────────────────────────────────┘
```

### Form State

```typescript
┌────────────────────────────────────────────┐
│ <button                                    │
│   disabled={isLimited || isLoading}        │
│   className={isLimited ? 'disabled' : ''} │
│ >                                          │
│   {isLimited                               │
│     ? `Try again in ${countdown}s`         │
│     : isLoading                            │
│     ? 'Loading...'                         │
│     : 'Submit'                             │
│   }                                        │
│ </button>                                  │
└────────────────────────────────────────────┘
```

---

## 🔒 Security Features

```
ATTACK                          PROTECTION
─────────────────────────────────────────────
Brute Force Password        →  5 attempts/min
Spam Registration           →  3 attempts/min
Account Enumeration         →  10 checks/min
Password Reset Abuse        →  3 attempts/min
                            
Per-IP Tracking             →  One IP can't spam
Automatic Reset             →  60 second timeout
Standard HTTP Response      →  429 status code
User-Friendly Message       →  Countdown timer
```

---

## 📈 Endpoint Rate Limits

```
┌────────────────────────────────────────────────────┐
│ ENDPOINT                    LIMIT      TYPE        │
├────────────────────────────────────────────────────┤
│ POST /api/login             5/min      Security    │
│ POST /api/register          3/min      Security    │
│ GET /api/verify-email/...   10/min     Flexible    │
│ POST /api/forgot-password   3/min      Security    │
│ POST /api/reset-password    3/min      Security    │
│ POST /api/check-email       10/min     Flexible    │
│ POST /api/email/verify-     3/min      Security    │
│       notification                                 │
└────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Via curl (6 rapid attempts)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\n%{http_code}"
done
```

Expected Results:
```
422  ← Request 1 (validation error)
422  ← Request 2
422  ← Request 3
422  ← Request 4
422  ← Request 5
429  ← Request 6 (RATE LIMITED!) ← JSON with Retry-After
```

### Via Browser Console
```javascript
// Paste this and run:
for (let i = 0; i < 6; i++) {
  fetch('http://localhost:8000/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'wrong'
    })
  })
  .then(r => r.json())  // Safe - always JSON now!
  .then(d => console.log(d))
  .catch(e => console.error(e));
}
```

---

## ✨ Summary Grid

```
┌──────────────────────┬──────────────────────┐
│ BEFORE THIS UPDATE   │ AFTER THIS UPDATE    │
├──────────────────────┼──────────────────────┤
│ ❌ HTML error pages  │ ✅ JSON responses    │
│ ❌ Parse errors      │ ✅ No parse errors   │
│ ❌ Confusing text    │ ✅ Countdown timer   │
│ ❌ Manual retry wait │ ✅ Auto re-enable    │
│ ❌ No headers        │ ✅ Retry-After header│
│ ❌ Unprofessional    │ ✅ Professional UX   │
└──────────────────────┴──────────────────────┘
```

---

## 🎓 Key Files

```
BACKEND:
├─ app/Http/Middleware/HandleRateLimitJson.php
│  └─ Catches rate limit exceptions, returns JSON
├─ bootstrap/app.php
│  └─ Registers JSON middleware
├─ routes/auth.php
│  └─ Has throttle middleware on all endpoints
└─ .env
   └─ Rate limit configuration variables

FRONTEND:
├─ src/lib/api.ts
│  └─ Handles HTTP 429 responses
└─ src/hooks/useRateLimit.ts
   └─ Manages countdown timer
```

---

## ⚡ Quick Start

1. **Backend:**
   ```bash
   php artisan config:cache
   php artisan cache:clear
   php artisan serve
   ```

2. **Frontend:**
   ```bash
   cd heritage-oil-gas-main
   npm run dev
   ```

3. **Test:**
   - Try to login 6 times rapidly
   - See "Try again in 60s" message
   - Watch countdown timer
   - Button re-enables automatically

---

## ✅ Verification

- [x] Middleware catches rate limit exceptions
- [x] Returns JSON responses (not HTML)
- [x] Content-Type header is `application/json`
- [x] Retry-After header included
- [x] Frontend API client handles 429
- [x] useRateLimit hook available
- [x] Countdown timer works
- [x] Form disables/enables correctly
- [x] User sees friendly message

**Everything is ready for production!**

