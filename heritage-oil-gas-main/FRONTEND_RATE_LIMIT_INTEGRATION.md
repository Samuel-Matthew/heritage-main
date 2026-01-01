# Frontend Rate Limit Integration Guide

## Overview

The backend now enforces rate limits on all authentication endpoints. The frontend needs to handle HTTP 429 responses gracefully and provide feedback to users.

## HTTP 429 Response Example

When rate limited, the backend responds with:

```
Status Code: 429 Too Many Requests

Response Headers:
- Retry-After: 45 (seconds)
- X-RateLimit-Limit: 5 (max requests)
- X-RateLimit-Remaining: 0 (remaining requests)
- X-RateLimit-Reset: 1735589400 (unix timestamp)

Response Body:
{
  "message": "Too many requests. Please try again in 45 seconds.",
  "success": false
}
```

## Implementation Guide

### 1. Axios Interceptor for Rate Limit Handling

Create or update your API client interceptor in `src/lib/api.ts`:

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// Response interceptor for rate limit handling
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = (error.response.data as any)?.message || 
                     'Too many requests. Please try again later.';
      
      // Create custom error with rate limit info
      const rateLimitError = new Error(message) as AxiosError;
      rateLimitError.response = error.response;
      (rateLimitError as any).retryAfter = parseInt(retryAfter || '60');
      
      return Promise.reject(rateLimitError);
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Custom Hook for Rate Limit Handling

Create `src/hooks/useRateLimit.ts`:

```typescript
import { useState, useCallback } from 'react';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  message: string;
}

export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: 0,
    message: '',
  });

  const [countdown, setCountdown] = useState(0);

  const handleRateLimitError = useCallback((retryAfter: number, message: string) => {
    setRateLimitState({
      isLimited: true,
      retryAfter,
      message,
    });

    setCountdown(retryAfter);

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRateLimitState({
            isLimited: false,
            retryAfter: 0,
            message: '',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetRateLimit = useCallback(() => {
    setRateLimitState({
      isLimited: false,
      retryAfter: 0,
      message: '',
    });
    setCountdown(0);
  }, []);

  return {
    ...rateLimitState,
    countdown,
    handleRateLimitError,
    resetRateLimit,
  };
};
```

### 3. Login Component with Rate Limiting

Update `src/pages/Login.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useRateLimit } from '@/hooks/useRateLimit';
import Toast from '@/components/ui/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { isLimited, countdown, handleRateLimitError, resetRateLimit } = 
    useRateLimit();

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
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        // Handle rate limit
        const retryAfter = err.retryAfter || 60;
        const message = err.message || 'Too many login attempts';
        
        handleRateLimitError(retryAfter, message);
        setError(`${message}. Try again in ${retryAfter}s`);
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      {error && (
        <Toast 
          type="error" 
          message={error}
          isVisible={!!error}
          onClose={() => setError('')}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={isLimited || isLoading}
          className={`w-full py-2 rounded-lg font-medium ${
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

      {isLimited && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Too many login attempts. Please wait {countdown} second(s) before trying again.
          </p>
        </div>
      )}
    </div>
  );
}
```

### 4. Registration Component with Rate Limiting

Update `src/pages/Register.tsx`:

```typescript
import { useState } from 'react';
import api from '@/lib/api';
import { useRateLimit } from '@/hooks/useRateLimit';
import Toast from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

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
  
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();

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
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        // Handle rate limit
        const retryAfter = err.retryAfter || 60;
        handleRateLimitError(retryAfter, err.message);
        setError(`Too many registration attempts. Try again in ${retryAfter}s`);
      } else if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setError(Object.values(errors)[0]?.[0] || 'Validation error');
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Register</h1>

      {error && (
        <Toast 
          type="error" 
          message={error}
          isVisible={!!error}
          onClose={() => setError('')}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            value={formData.password_confirmation}
            onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
            disabled={isLimited || isLoading}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={isLimited || isLoading}
          className={`w-full py-2 rounded-lg font-medium ${
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

      {/* Success Modal */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              A verification email has been sent to <strong>{registeredEmail}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Please check your email and click the verification link to activate your account.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
```

### 5. Email Check with Rate Limiting

If you have an email availability check endpoint:

```typescript
import { useState, useCallback } from 'react';
import api from '@/lib/api';

export const useEmailAvailability = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState('');

  const checkEmail = useCallback(async (email: string) => {
    if (!email) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setCheckError('');

    try {
      const response = await api.post('/check-email', { email });
      setIsAvailable(response.data.available);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setCheckError('Too many email checks. Please try again later.');
      } else {
        setCheckError(err.response?.data?.message || 'Error checking email');
      }
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { isChecking, isAvailable, checkError, checkEmail };
};
```

## Error Handling Best Practices

### 1. Show Clear Messages

```typescript
const handleAPIError = (error: any) => {
  if (error.response?.status === 429) {
    // Rate limit error - show friendly message
    const retryAfter = error.response.headers['retry-after'] || 60;
    return `Too many requests. Please try again in ${retryAfter} seconds.`;
  }
  
  if (error.response?.status === 422) {
    // Validation error
    return 'Please check your input and try again.';
  }
  
  return 'An error occurred. Please try again.';
};
```

### 2. Disable Form During Rate Limit

```typescript
<button
  disabled={isLimited || isLoading}
  className={`${isLimited ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  {isLimited ? `Try again in ${countdown}s` : 'Submit'}
</button>
```

### 3. Provide Countdown Feedback

```typescript
{isLimited && (
  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
    <p className="text-amber-900 font-medium">
      Too many attempts
    </p>
    <p className="text-amber-700 text-sm mt-1">
      Please wait {countdown} second{countdown !== 1 ? 's' : ''} before trying again.
    </p>
  </div>
)}
```

## Testing Rate Limits Frontend

### Test Script

```typescript
// In browser console
async function testRateLimit() {
  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
  });

  for (let i = 1; i <= 7; i++) {
    try {
      const response = await api.post('/login', {
        email: 'test@example.com',
        password: 'wrong'
      });
      console.log(`Request ${i}: Success`, response.status);
    } catch (error) {
      const status = error.response?.status;
      const retryAfter = error.response?.headers['retry-after'];
      console.log(
        `Request ${i}: Failed - Status ${status}` +
        (retryAfter ? ` - Retry after ${retryAfter}s` : '')
      );
    }
    
    // Wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testRateLimit();
```

## Production Checklist

- [ ] Test all rate-limited endpoints with real throttling
- [ ] Verify 429 responses include proper headers
- [ ] Test countdown timer functionality
- [ ] Ensure form is disabled during rate limit
- [ ] Test on different browsers
- [ ] Verify accessibility (keyboard, screen readers)
- [ ] Test network errors alongside rate limits
- [ ] Monitor error logs for rate limit hits

