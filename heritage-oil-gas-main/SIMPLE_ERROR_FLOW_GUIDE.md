# Error Display Flow - Simple Version

## The Answer in One Picture

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Laravel)                    │
│                                                         │
│  User tries login 6 times                              │
│  ↓                                                      │
│  Rate limit exceeded                                    │
│  ↓                                                      │
│  Returns JSON Response:                                 │
│  {                                                      │
│    "success": false,                                    │
│    "message": "Too many requests. Please try           │
│               again in 45 seconds."                     │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                        ↓ (JSON over HTTP)
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                      │
│                                                         │
│  1. API Client receives JSON ✓                         │
│  2. Parses JSON ✓                                       │
│  3. Component catches error ✓                           │
│  4. Calls handleRateLimitError() ✓                      │
│  5. Updates form state ✓                                │
│  6. Calls toast() ✓                                     │
│                                                         │
│     ┌──────────────────────────────┐                   │
│     │ ⚠️  Too Many Attempts        │ ← TOAST APPEARS! │
│     │ Please wait 45 seconds       │                   │
│     └──────────────────────────────┘                   │
│                                                         │
│  7. Button disabled, shows countdown ✓                 │
│  8. After 45 seconds: Button re-enabled ✓              │
└─────────────────────────────────────────────────────────┘

USER SEES: ⚠️  Friendly toast message
USER SEES: Countdown timer on button
USER DOES NOT SEE: Any JSON! ✓
```

---

## What Users Experience

### ✅ What They See:
```
1. Fill login form
   ↓
2. Click Login button (works 1-5 times)
   ↓
3. Click 6th time
   ↓
   ┌──────────────────────────────┐
   │ ⚠️  Too Many Attempts        │
   │ Please wait 45 seconds       │
   └──────────────────────────────┘  ← Nice toast!
   
   Button: "Try again in 45s"
   ↓
4. Watch countdown: 45 → 44 → 43...
   ↓
5. After 45 seconds:
   Button: "Try again"  ← Re-enabled!
   ↓
6. Can try login again
```

### ❌ What They DON'T See:
```
❌ {"success":false,"message":"Too many requests..."}
❌ [Object object]
❌ JSON.parse error
❌ Technical error codes
❌ Stack traces
❌ HTML error pages
```

---

## Code Flow Simplified

```typescript
// User submits form
handleSubmit()
  ↓
try {
  // Make request to backend
  await api.post('/login', data)
}

// 🎯 6th attempt exceeds rate limit
// Backend returns HTTP 429 with JSON

catch (error: any) {
  // ✨ Check if rate limited
  if (error.isRateLimited) {
    
    // Update internal state
    handleRateLimitError(
      error.retryAfter,  // 45
      error.message      // "Too many requests..."
    )
    
    // ✨ SHOW TOAST TO USER
    toast({
      title: '⚠️ Too Many Attempts',
      description: `Please wait ${error.retryAfter} seconds before trying again`,
      variant: 'destructive',
    })
    
    // User sees toast! ✨
    // No JSON displayed! ✓
  }
}
```

---

## Three Different Screens

### Screen 1: Normal Login (Attempts 1-5)
```
┌─────────────────────────────┐
│ Heritage Energy Login       │
├─────────────────────────────┤
│                             │
│ Email: user@example.com     │
│ Password: ••••••••••        │
│                             │
│  [     LOGIN BUTTON     ]   │
│                             │
│ Forgot password? | Sign up  │
└─────────────────────────────┘
```

### Screen 2: Rate Limited (After 5 attempts)
```
┌─────────────────────────────┐
│ Heritage Energy Login       │
├─────────────────────────────┤
│                             │
│ Email: user@example.com     │
│ Password: ••••••••••        │
│                             │
│  [   TRY AGAIN IN 45S   ]   │ ← Disabled
│  (Countdown running)        │
│                             │
│ Forgot password? | Sign up  │
└─────────────────────────────┘

Top of screen shows:
┌──────────────────────────────┐
│ ⚠️  Too Many Attempts        │
│ Please wait 45 seconds       │
└──────────────────────────────┘ ← Toast!
```

### Screen 3: After Cooldown (45 seconds later)
```
┌─────────────────────────────┐
│ Heritage Energy Login       │
├─────────────────────────────┤
│                             │
│ Email: user@example.com     │
│ Password: ••••••••••        │
│                             │
│  [     LOGIN BUTTON     ]   │ ← Re-enabled!
│                             │
│ Forgot password? | Sign up  │
└─────────────────────────────┘

Toast auto-dismisses
User can try again!
```

---

## Backend → Frontend → User

```
BACKEND LAYER:
┌──────────────────────────────┐
│ Request 6 exceeds limit      │
│ Returns HTTP 429             │
│ Body: {"message":"..."}      │
│ (This is JSON for the API)   │
└──────────────────────────────┘

              ↓

FRONTEND API LAYER:
┌──────────────────────────────┐
│ Receives HTTP 429            │
│ Reads JSON body              │
│ Extracts message             │
│ Creates error object         │
│ (Still just API interaction) │
└──────────────────────────────┘

              ↓

FRONTEND COMPONENT LAYER:
┌──────────────────────────────┐
│ Catches error                │
│ Calls handleRateLimitError() │
│ Calls toast()                │
│ ✨ SHOWS TOAST TO USER ✨    │
│ (This is what user sees!)    │
└──────────────────────────────┘

              ↓

USER SEES:
┌──────────────────────────────┐
│ ⚠️  Too Many Attempts        │
│ Please wait 45 seconds       │
└──────────────────────────────┘
(Friendly message, no JSON!)
```

---

## Why This Works

```
Backend returns JSON
├─ Why? Computers need structured data
├─ Format? {"success": false, "message": "..."}
└─ Good for: API consistency, error parsing

Frontend parses JSON
├─ Why? Extract the important info
├─ Extract: The error message
└─ Good for: Handling all response types

Component shows Toast
├─ Why? Users need friendly messages
├─ Display: User-friendly toast
└─ Good for: Great UX, happy users

Result:
✅ Backend returns JSON (for API consistency)
✅ Frontend parses JSON (for proper handling)
✅ Users see Toast (for great UX)
✅ No JSON shown to users!
```

---

## Test It Right Now

### In Your Login Component:

```typescript
import { useToast } from '@/hooks/use-toast';  // Your existing toast
import { useRateLimit } from '@/hooks/useRateLimit';  // Our new hook
import api from '@/lib/api';  // Already updated

export default function Login() {
  const { toast } = useToast();  // ← Add this
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();  // ← Add this

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/login', { email, password });
      // Success...
    } catch (error: any) {
      if (error.isRateLimited) {  // ← Add this check
        handleRateLimitError(error.retryAfter, error.message);
        
        // ← Add this toast
        toast({
          title: '⚠️ Too Many Attempts',
          description: `Please wait ${error.retryAfter} seconds before trying again`,
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
      <button disabled={isLimited || isLoading}>
        {isLimited ? `Try again in ${countdown}s` : 'Login'}
      </button>
    </form>
  );
}
```

Then test:
1. Try login 6 times rapidly
2. See toast message appear
3. See countdown on button
4. Wait for timeout
5. Button re-enables

**You'll see a toast, not JSON!** ✓

---

## Summary in One Line

**Backend returns JSON (for computers) → Frontend converts to toast (for humans)**

