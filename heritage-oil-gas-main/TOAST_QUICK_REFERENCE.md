# Toast Display - Quick Reference Card

## ✅ TL;DR: Yes, Toast Notifications Will Show!

```
When user is rate limited:
  Backend → Returns JSON
  ↓
  Frontend → Parses JSON
  ↓
  Component → Shows Toast
  ↓
  User → Sees: "⚠️ Too Many Attempts"
  
NOT JSON! ✓
```

---

## Copy-Paste Implementation

### Step 1: Import in Your Component
```typescript
import { useToast } from '@/hooks/use-toast';         // Your existing hook
import { useRateLimit } from '@/hooks/useRateLimit';  // New hook
import api from '@/lib/api';                          // Already updated
```

### Step 2: Initialize Hooks
```typescript
const { toast } = useToast();
const { isLimited, countdown, handleRateLimitError } = useRateLimit();
```

### Step 3: Add Error Handling
```typescript
try {
  await api.post('/login', data);
} catch (error: any) {
  if (error.isRateLimited) {
    handleRateLimitError(error.retryAfter, error.message);
    
    toast({
      title: '⚠️ Too Many Attempts',
      description: `Please wait ${error.retryAfter}s before trying again`,
      variant: 'destructive',
    });
  }
}
```

### Step 4: Disable Form
```typescript
<button disabled={isLimited || isLoading}>
  {isLimited ? `Try again in ${countdown}s` : 'Submit'}
</button>
```

---

## What Happens

| Step | What | User Sees |
|------|------|-----------|
| 1 | Try login 5 times | Form works normally |
| 2 | Try login 6th time | Toast appears |
| 3 | Toast shows message | "⚠️ Too Many Attempts" |
| 4 | Button disables | "Try again in 45s" |
| 5 | Countdown runs | 45 → 44 → 43... |
| 6 | After 45 seconds | Button re-enables |
| 7 | User can try again | Form works again |

---

## Real Code Examples

### Login Component
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { toast } = useToast();
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      if (response.data.success) {
        toast({ title: 'Success', description: 'Logged in!' });
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error.isRateLimited) {
        handleRateLimitError(error.retryAfter, error.message);
        toast({
          title: '⚠️ Too Many Attempts',
          description: `Wait ${error.retryAfter}s before trying again`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Login failed',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      
      <div className="mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={isLimited || isLoading}
          className="w-full px-4 py-2 border rounded disabled:opacity-50"
        />
      </div>

      <div className="mb-6">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={isLimited || isLoading}
          className="w-full px-4 py-2 border rounded disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isLimited || isLoading}
        className={`w-full py-2 rounded font-medium transition-colors ${
          isLimited || isLoading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Logging in...' : 
         isLimited ? `Try again in ${countdown}s` : 
         'Login'}
      </button>
    </form>
  );
}
```

### Registration Component
```typescript
import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', password_confirmation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const { toast } = useToast();
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/register', formData);
      if (response.data.success) {
        setShowModal(true);
        toast({
          title: 'Success',
          description: 'Check your email to verify your account',
        });
      }
    } catch (error: any) {
      if (error.isRateLimited) {
        handleRateLimitError(error.retryAfter, error.message);
        toast({
          title: '⚠️ Too Many Attempts',
          description: `Wait ${error.retryAfter}s before trying again`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Registration failed',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        disabled={isLimited}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        disabled={isLimited}
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        disabled={isLimited}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={formData.password_confirmation}
        onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
        disabled={isLimited}
      />
      
      <button disabled={isLimited || isLoading}>
        {isLoading ? 'Registering...' :
         isLimited ? `Try again in ${countdown}s` :
         'Register'}
      </button>
    </form>
  );
}
```

---

## Visual Timeline

```
SECOND 1: User clicks login
  ↓
SECOND 2-5: 5 normal attempts (form works)
  ↓
SECOND 6: 6th attempt - RATE LIMITED!
  ↓
INSTANT: Toast appears
  ┌────────────────────┐
  │ ⚠️ Too Many        │
  │ Wait 45 seconds    │
  └────────────────────┘
  ↓
SECONDS 6-50: Countdown timer
  Button: "Try again in 45s"
  Button: "Try again in 44s"
  Button: "Try again in 43s"
  ...
  ↓
SECOND 51: Countdown ends
  ↓
INSTANT: Button re-enables
  Button: "Login" (clickable again!)
  ↓
User can try again
```

---

## Status Indicators

### Before Rate Limit
```
Button: "Login" (blue, clickable)
Form: All inputs enabled
Toast: None
```

### During Rate Limit
```
Button: "Try again in 45s" (gray, disabled)
Form: All inputs disabled
Toast: Showing "Too Many Attempts"
```

### After Rate Limit
```
Button: "Login" (blue, clickable)
Form: All inputs enabled
Toast: Dismissed automatically
```

---

## No JSON Shown ✓

```
❌ User NEVER sees: {"success":false,"message":"..."}
❌ User NEVER sees: [object Object]
❌ User NEVER sees: JSON.parse error

✅ User ALWAYS sees: Nice toast notification
✅ User ALWAYS sees: Countdown timer
✅ User ALWAYS sees: Friendly message
```

---

## Checklist

- [ ] Import useToast
- [ ] Import useRateLimit
- [ ] Initialize hooks in component
- [ ] Add error.isRateLimited check
- [ ] Call handleRateLimitError()
- [ ] Call toast() with error message
- [ ] Disable form inputs: disabled={isLimited}
- [ ] Show countdown: `Try again in ${countdown}s`
- [ ] Test with 6 rapid attempts
- [ ] Verify toast appears (not JSON)

---

## That's It!

Just add:
1. ✅ Hook initialization
2. ✅ Error check
3. ✅ Toast call
4. ✅ Form disable

**Users see toast, not JSON!** 🎉

