# Frontend Rate Limit Integration - Updated API Client

## ✅ Updates Applied

The frontend API client (`src/lib/api.ts`) has been updated to handle rate limiting (HTTP 429) responses, and a new `useRateLimit` hook has been created for managing rate limit state in React components.

---

## 🔧 What Changed

### API Client Updates (`src/lib/api.ts`)

The response interceptor now handles HTTP 429 (Too Many Requests) responses:

```typescript
// When rate limited, creates a detailed error object with:
- error.status = 429
- error.isRateLimited = true
- error.retryAfter = number of seconds to wait
- error.message = user-friendly message from server
```

**Example Error Object:**
```javascript
{
  message: "Too many requests. Please try again in 45 seconds.",
  response: { /* full response */ },
  status: 429,
  retryAfter: 45,
  isRateLimited: true
}
```

### New Hook: `useRateLimit` (`src/hooks/useRateLimit.ts`)

A custom React hook that manages rate limit state, including countdown timer:

```typescript
const {
  isLimited,           // boolean - is currently rate limited?
  retryAfter,          // number - seconds until reset
  message,             // string - error message
  countdown,           // number - current countdown (updates every second)
  handleRateLimitError, // function - call this to handle error
  resetRateLimit       // function - clear rate limit state
} = useRateLimit();
```

---

## 📚 Usage Examples

### Basic Login Component

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLimited) {
      setError(`Too many login attempts. Try again in ${countdown}s`);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.isRateLimited) {
        // Handle rate limit error
        handleRateLimitError(err.retryAfter, err.message);
        setError(`${err.message}`);
        toast({
          title: 'Too Many Attempts',
          description: `Please wait ${err.retryAfter} seconds before trying again`,
          variant: 'destructive',
        });
      } else {
        // Handle other errors
        setError(err.response?.data?.message || 'Login failed');
        toast({
          title: 'Error',
          description: setError,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLimited || isLoading}
          className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLimited || isLoading}
          className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLimited || isLoading}
        className={`w-full py-2 rounded-lg font-medium transition-colors ${
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

### Registration Component with Rate Limiting

```typescript
import { useState } from 'react';
import api from '@/lib/api';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { toast } = useToast();
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLimited) {
      setError(`Too many registration attempts. Try again in ${countdown}s`);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/register', formData);

      if (response.data.success) {
        setRegisteredEmail(formData.email);
        setShowModal(true);
        setFormData({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
        });
        toast({
          title: 'Registration Successful',
          description: 'Check your email to verify your account',
        });
      }
    } catch (err: any) {
      if (err.isRateLimited) {
        // Handle rate limit
        handleRateLimitError(err.retryAfter, err.message);
        setError(`Too many registration attempts. Try again in ${err.retryAfter}s`);
        toast({
          title: 'Too Many Attempts',
          description: `Please wait ${err.retryAfter} seconds before trying again`,
          variant: 'destructive',
        });
      } else if (err.response?.status === 422) {
        // Handle validation errors
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0];
        setError(firstError || 'Validation error');
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Register</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            value={formData.password_confirmation}
            onChange={handleChange}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLimited || isLoading}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            isLimited || isLoading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Registering...' : 
           isLimited ? `Try again in ${countdown}s` : 
           'Register'}
        </button>
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm">
            <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              A verification email has been sent to <strong>{registeredEmail}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Please check your email and click the verification link to activate your account.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Email Availability Check Hook

```typescript
import { useState, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Hook for checking email availability with rate limit handling
 */
export const useEmailAvailability = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);

  const checkEmail = useCallback(async (email: string) => {
    if (!email) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setCheckError('');
    setIsRateLimited(false);

    try {
      const response = await api.post('/check-email', { email });
      setIsAvailable(response.data.available);
    } catch (err: any) {
      if (err.isRateLimited) {
        setIsRateLimited(true);
        setCheckError(
          `Too many checks. Please try again in ${err.retryAfter} seconds.`
        );
      } else {
        setCheckError(err.response?.data?.message || 'Error checking email');
      }
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isChecking,
    isAvailable,
    checkError,
    isRateLimited,
    checkEmail,
  };
};
```

Usage in form:
```typescript
const { isChecking, isAvailable, checkError, isRateLimited, checkEmail } = 
  useEmailAvailability();

const handleEmailChange = (email: string) => {
  setEmail(email);
  // Debounce for real email checks
  checkEmail(email);
};

// Show availability status
{email && !isRateLimited && (
  <div className={`text-sm mt-1 ${
    isAvailable === null ? 'text-gray-500' :
    isAvailable ? 'text-green-600' :
    'text-red-600'
  }`}>
    {isChecking ? 'Checking...' :
     isAvailable === null ? '' :
     isAvailable ? '✓ Email available' :
     '✗ Email already registered'}
  </div>
)}

{checkError && (
  <div className="text-sm text-red-600 mt-1">{checkError}</div>
)}
```

---

## 🎯 Key Integration Points

### 1. Check for Rate Limit in Error Handlers
```typescript
if (err.isRateLimited) {
  handleRateLimitError(err.retryAfter, err.message);
}
```

### 2. Disable Form During Rate Limit
```typescript
<button disabled={isLimited || isLoading}>
  {isLimited ? `Try again in ${countdown}s` : 'Submit'}
</button>
```

### 3. Show User-Friendly Messages
```typescript
{isLimited && (
  <div className="p-3 bg-amber-50 border border-amber-200 rounded">
    <p className="text-amber-900 font-medium">Too many attempts</p>
    <p className="text-amber-700 text-sm">
      Please wait {countdown} second{countdown !== 1 ? 's' : ''} before trying again.
    </p>
  </div>
)}
```

---

## 📋 Implementation Checklist

- [x] API client updated with rate limit handling
- [x] `useRateLimit` hook created
- [ ] Update Login component to use hook
- [ ] Update Register component to use hook
- [ ] Update any other auth-related forms
- [ ] Test with curl to trigger rate limits
- [ ] Test countdown timer
- [ ] Test form disable/enable
- [ ] Verify error messages show correctly

---

## 🧪 Quick Testing

### Test Login Rate Limit

```bash
# Open browser console and run:
for (let i = 0; i < 7; i++) {
  setTimeout(() => {
    fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong'
      })
    }).then(r => r.json()).then(d => console.log(`Request ${i+1}:`, d));
  }, i * 500);
}

// Requests 1-5 should fail with 422
// Requests 6-7 should return 429
```

---

## 🔄 Next Steps

1. Review the example components above
2. Update your existing Login/Register components
3. Test with curl/browser to trigger rate limits
4. Verify countdown timer works
5. Check that forms disable/enable correctly
6. Deploy and monitor in production

