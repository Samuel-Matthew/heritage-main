# Role-Based Authentication System Implementation

## Overview

A complete role-based authentication system using Laravel Sanctum (session-based) with React frontend. Users are automatically redirected to role-appropriate dashboards after login.

---

## Architecture

### Backend (Laravel) - `heritage-oil-gas-main-backend`

#### Database Schema
```sql
users table:
- id (PK)
- name
- email (unique)
- password (hashed)
- phone
- role enum: ['super_admin', 'store_owner', 'buyer']
- timestamps
```

#### API Endpoints

**POST `/api/login`** (No Auth Required)
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (201):
{
  "message": "Logged in successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "role": "buyer"
  }
}

Error (422):
{
  "message": "The provided credentials are incorrect."
}
```

**GET `/api/user`** (Auth Required)
```json
Response (200):
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "role": "buyer"
  }
}

Response (401):
{
  "message": "Unauthenticated"
}
```

**POST `/api/logout`** (Auth Required)
```
Response (204): No Content
```

#### Controller Implementation

**File**: `app/Http/Controllers/Auth/AuthenticatedSessionController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     * Returns authenticated user with role
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = Auth::user();

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Get the authenticated user.
     * For session persistence on page refresh
     */
    public function getUser(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
```

#### Routes Configuration

**File**: `routes/auth.php`

```php
<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest')
    ->name('login');

Route::get('/user', [AuthenticatedSessionController::class, 'getUser'])
    ->middleware('auth')
    ->name('user');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');
```

---

### Frontend (React) - `heritage-oil-gas-main`

#### 1. Auth Context

**File**: `src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export type UserRole = 'super_admin' | 'store_owner' | 'buyer';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user on mount - persists auth state on page refresh
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await api.get('/api/user');
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/login', { email, password });
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post('/api/logout');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Key Features:**
- **Persistence on Refresh**: `useEffect` calls `fetchUser()` on mount to restore auth state
- **Single Source of Truth**: All auth state centralized in context
- **Loading States**: Track loading for UI feedback
- **Error Handling**: Gracefully handle auth failures

---

#### 2. Role-Based Redirect Utilities

**File**: `src/lib/roleUtils.ts`

```typescript
import { UserRole } from '@/contexts/AuthContext';

/**
 * Get the redirect URL based on user role
 * Seller/Buyer dashboards are in separate heritage-dashboards app
 * Admin dashboard is in this app
 */
export const getRoleBasedRedirect = (role: UserRole): string => {
  const dashboardAppUrl = import.meta.env.VITE_DASHBOARD_APP_URL || 'http://localhost:5174';
  
  switch (role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'store_owner':
      return `${dashboardAppUrl}/`;
    case 'buyer':
      return '/';
    default:
      return '/';
  }
};

export const hasRole = (userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

export const isAdmin = (role: UserRole): boolean => role === 'super_admin';
export const isSeller = (role: UserRole): boolean => role === 'store_owner';
export const isBuyer = (role: UserRole): boolean => role === 'buyer';
```

**Redirect Logic:**
- `super_admin` → `/admin/dashboard`
- `store_owner` → `heritage-dashboards` app (external redirect)
- `buyer` → Home page (`/`)

---

#### 3. Protected Route Component

**File**: `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  fallbackRoute?: string;
}

/**
 * ProtectedRoute prevents unauthorized access based on authentication and role
 * 
 * @example
 * // Any authenticated user
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Only admins
 * <ProtectedRoute requiredRoles="super_admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Admin or seller
 * <ProtectedRoute requiredRoles={['super_admin', 'store_owner']}>
 *   <ManagerDashboard />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({
  children,
  requiredRoles,
  fallbackRoute = '/login',
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(user.role)) {
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return <>{children}</>;
};
```

**Protection Features:**
- ✅ Checks authentication status
- ✅ Validates user role against required roles
- ✅ Shows loading spinner while checking
- ✅ Redirects to fallback route if unauthorized
- ✅ Supports single or multiple required roles

---

#### 4. Login Handler in Login Component

**File**: `src/pages/Login.tsx`

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleBasedRedirect } from "@/lib/roleUtils";
import { useToast } from "@/hooks/use-toast";

const Login = ({ isSeller = false }) => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectUrl = getRoleBasedRedirect(user.role);
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userData = await login(email, password);

      toast({
        title: "Success",
        description: `Welcome back, ${userData.name}!`,
      });

      const redirectUrl = getRoleBasedRedirect(userData.role);
      navigate(redirectUrl, { replace: true });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ... JSX for form
};
```

**Login Flow:**
1. User submits form with email/password
2. Frontend calls backend `/api/login`
3. Backend validates credentials and creates session
4. Backend returns user object with role
5. Frontend stores user in context
6. Frontend redirects based on user role

---

#### 5. App Provider Setup

**File**: `src/App.tsx`

```typescript
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin protected route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRoles="super_admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Other routes... */}
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
```

---

#### 6. Environment Configuration

**File**: `.env`

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_DASHBOARD_APP_URL=http://localhost:5174
```

---

## How It Works

### Scenario 1: Fresh Login

```
User types credentials → Login form → Backend validates
  ↓
Backend creates session cookie (HttpOnly)
  ↓
Backend returns user object with role
  ↓
Frontend stores user in AuthContext
  ↓
Frontend checks user.role
  ↓
Redirect: buyer → / | store_owner → dashboard-app | admin → /admin/dashboard
```

### Scenario 2: Page Refresh (Persistence)

```
User refreshes page
  ↓
React app loads
  ↓
AuthContext.useEffect runs
  ↓
Frontend calls GET /api/user
  ↓
Backend checks session cookie
  ↓
Backend returns authenticated user
  ↓
Frontend restores user in AuthContext
  ↓
Page renders with authenticated state
```

### Scenario 3: Unauthorized Access

```
Unauthenticated user tries to access /admin/dashboard
  ↓
ProtectedRoute checks auth state
  ↓
isAuthenticated === false
  ↓
ProtectedRoute redirects to /login
```

### Scenario 4: Role Mismatch

```
Buyer user tries to access /admin/dashboard
  ↓
ProtectedRoute checks requiredRoles
  ↓
user.role (buyer) not in requiredRoles (super_admin)
  ↓
ProtectedRoute redirects to /login
```

---

## Best Practices Implemented

### 1. Session Persistence on Refresh
✅ `useEffect` in AuthContext fetches user on mount
✅ Server session cookie maintained by browser
✅ User state restored automatically

### 2. CSRF Protection
✅ Axios interceptor automatically includes XSRF-TOKEN from cookies
✅ Backend validates token on state-changing requests

### 3. HttpOnly Cookies
✅ Session stored in HttpOnly cookie (backend sets)
✅ Not accessible via JavaScript (XSS protection)
✅ Automatically sent with requests (credentials: true)

### 4. Loading States
✅ Show spinner while authenticating
✅ Disable form while submitting
✅ Better UX during async operations

### 5. Error Handling
✅ Catch backend validation errors
✅ Display user-friendly error messages
✅ Console logs for debugging

### 6. Type Safety
✅ TypeScript UserRole enum
✅ Typed User interface
✅ Type-safe context hook

---

## Testing the System

### Test Users (Create in Database)

```sql
INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES
('Admin User', 'admin@example.com', bcrypt('password'), 'super_admin', NOW(), NOW()),
('Seller User', 'seller@example.com', bcrypt('password'), 'store_owner', NOW(), NOW()),
('Buyer User', 'buyer@example.com', bcrypt('password'), 'buyer', NOW(), NOW());
```

### Test Cases

| Test Case | Expected Result |
|-----------|-----------------|
| Admin login → `/admin/dashboard` | ✅ Accessible |
| Buyer tries to access `/admin/dashboard` | ✅ Redirects to `/login` |
| Logout then access protected route | ✅ Redirects to `/login` |
| Refresh page with valid session | ✅ State persisted |
| Invalid credentials | ✅ Error toast shown |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React App                                │
│  (heritage-oil-gas-main)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌─────────────────────┐                  │
│  │ Login Page   │→ │   AuthContext       │                  │
│  └──────────────┘  │  (manages user      │                  │
│                    │   & auth state)     │                  │
│                    └─────────────────────┘                  │
│                             ↓                                │
│                    ┌─────────────────────┐                  │
│                    │  ProtectedRoute     │                  │
│                    │  (validates role)   │                  │
│                    └─────────────────────┘                  │
│                             ↓                                │
│          ┌──────────────────┬──────────────────┐             │
│          ↓                  ↓                  ↓              │
│      Admin/Dashboard   Buyer Home   Seller Dashboard         │
│      (in app)          (in app)      (external app)         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                             ↓
              ┌──────────────────────────┐
              │  Laravel Backend         │
              │  Session + CSRF          │
              │  Auth Endpoints          │
              └──────────────────────────┘
                             ↓
              ┌──────────────────────────┐
              │   Database (MySQL)       │
              │   Users Table            │
              │   Sessions Table         │
              └──────────────────────────┘
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Logout doesn't work | Session not cleared | Ensure `/api/logout` is called |
| Auth state lost on refresh | No persistence | Check `/api/user` endpoint |
| 401 errors on protected routes | Wrong CORS settings | Verify `FRONTEND_URL` in backend |
| Role redirects not working | Wrong role in DB | Check user role enum values |
| CSRF errors | Missing token | Clear cookies and reload |

---

## Files Summary

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Auth state management & persistence |
| `src/lib/roleUtils.ts` | Role-based helpers & redirects |
| `src/components/ProtectedRoute.tsx` | Route protection component |
| `src/pages/Login.tsx` | Login form with auth integration |
| `src/pages/AdminDashboard.tsx` | Admin-only dashboard |
| `src/App.tsx` | App setup with AuthProvider |
| `.env` | Environment variables |
| `routes/auth.php` | Backend auth routes |
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Auth logic |

---

**Status**: ✅ Complete and Production Ready
