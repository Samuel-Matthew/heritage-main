# Role-Based Authentication - Complete Implementation Examples

## Complete Code Examples

### 1. Backend Controller (Laravel)

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
     * Returns user object with role for role-based redirects
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
     * Get the authenticated user - used for session persistence on page refresh
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

---

### 2. React Login Handler with Axios

**File**: `src/pages/Login.tsx`

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleBasedRedirect } from "@/lib/roleUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectUrl = getRoleBasedRedirect(user.role);
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
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
      // Call useAuth hook to authenticate
      const userData = await login(email, password);

      toast({
        title: "Success",
        description: `Welcome back, ${userData.name}!`,
      });

      // Redirect based on user role
      const redirectUrl = getRoleBasedRedirect(userData.role);
      navigate(redirectUrl, { replace: true });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
```

---

### 3. Reusable Role-Based Redirect Helper

**File**: `src/lib/roleUtils.ts`

```typescript
import { UserRole } from '@/contexts/AuthContext';

/**
 * Get redirect URL based on user role
 * This is the single source of truth for dashboard URLs
 */
export const getRoleBasedRedirect = (role: UserRole): string => {
  // External dashboard app URL (heritage-dashboards)
  const dashboardAppUrl = import.meta.env.VITE_DASHBOARD_APP_URL || 'http://localhost:5174';
  
  switch (role) {
    case 'super_admin':
      // Admin dashboard in this app
      return '/admin/dashboard';
    case 'store_owner':
      // Seller dashboard in separate app
      return `${dashboardAppUrl}/`;
    case 'buyer':
      // Buyers see home page
      return '/';
    default:
      return '/';
  }
};

/**
 * Check if user has any of the required role(s)
 */
export const hasRole = (
  userRole: UserRole, 
  requiredRoles: UserRole | UserRole[]
): boolean => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

// Convenience helpers
export const isAdmin = (role: UserRole): boolean => role === 'super_admin';
export const isSeller = (role: UserRole): boolean => role === 'store_owner';
export const isBuyer = (role: UserRole): boolean => role === 'buyer';

/**
 * Usage Examples:
 * 
 * const userData = await login(email, password);
 * const redirectUrl = getRoleBasedRedirect(userData.role);
 * navigate(redirectUrl);
 * 
 * if (hasRole(user.role, ['super_admin', 'store_owner'])) {
 *   // Show admin/seller features
 * }
 */
```

---

### 4. Protected Route Component

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
 * ProtectedRoute prevents unauthorized access to routes
 * 
 * Features:
 * - Checks if user is authenticated
 * - Validates user has required role
 * - Shows loading state while checking
 * - Redirects to login if unauthorized
 */
export const ProtectedRoute = ({
  children,
  requiredRoles,
  fallbackRoute = '/login',
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Loading state while fetching user
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

  // Not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // Check role if required
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(user.role)) {
      // Role doesn't match, redirect
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // All checks passed, render component
  return <>{children}</>;
};

/**
 * Usage Examples:
 * 
 * // Any authenticated user
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Only admins
 * <ProtectedRoute requiredRoles="super_admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // Admin or seller
 * <ProtectedRoute requiredRoles={['super_admin', 'store_owner']}>
 *   <ManagementPanel />
 * </ProtectedRoute>
 * 
 * // Redirect to custom page if unauthorized
 * <ProtectedRoute 
 *   requiredRoles="store_owner" 
 *   fallbackRoute="/upgrade"
 * >
 *   <SellerFeature />
 * </ProtectedRoute>
 */
```

---

### 5. Auth Context with Session Persistence

**File**: `src/contexts/AuthContext.tsx`

```typescript
import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
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
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Fetch user on component mount
   * This restores auth state after page refresh (session persistence)
   */
  useEffect(() => {
    fetchUser();
  }, []);

  /**
   * Fetch authenticated user from backend
   * Backend checks session cookie and returns user if valid
   */
  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await api.get('/api/user');
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      // No valid session, clear auth state
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with email and password
   * Returns user object with role
   */
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/login', { email, password });
      const userData = response.data.user;
      
      // Store user in context
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   * Clears session on backend and frontend
   */
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
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

---

### 6. App Setup with Protected Routes

**File**: `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Index from './pages/Index';
import AdminDashboard from './pages/AdminDashboard';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />

          {/* Protected routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRoles="super_admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
```

---

## Example Flow: Admin Login

### Step 1: User Enters Credentials
```
Admin enters email: admin@example.com, password: secret123
```

### Step 2: Frontend Sends Request
```typescript
const userData = await login('admin@example.com', 'secret123');

// Axios request:
POST http://localhost:8000/api/login
{
  "email": "admin@example.com",
  "password": "secret123"
}
```

### Step 3: Backend Validates & Creates Session
```php
// Laravel validates credentials
$request->authenticate(); // Checks against database

// Creates session
$request->session()->regenerate();

// Returns user with role
return response()->json([
    'message' => 'Logged in successfully',
    'user' => [
        'id' => 1,
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'phone' => '+1234567890',
        'role' => 'super_admin'
    ]
]);

// Browser receives:
// - HttpOnly cookie: session_id=abc123
// - JSON response with user object
```

### Step 4: Frontend Stores User & Redirects
```typescript
// AuthContext stores user
setUser({
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '+1234567890',
  role: 'super_admin'
});

// Get redirect URL
const redirectUrl = getRoleBasedRedirect('super_admin');
// Returns: '/admin/dashboard'

// Navigate
navigate('/admin/dashboard', { replace: true });
```

### Step 5: User Sees Admin Dashboard
```
✓ AdminDashboard component renders
✓ Has access to user data via useAuth()
✓ Shows admin-specific features
```

---

## Example Flow: Page Refresh (Persistence)

### Step 1: User Refreshes Browser
```
User presses F5 or clicks refresh
React app reloads
```

### Step 2: AuthContext Runs useEffect
```typescript
useEffect(() => {
  fetchUser(); // Runs when component mounts
}, []);
```

### Step 3: Frontend Fetches User
```typescript
const response = await api.get('/api/user');
// Axios automatically includes session cookie in request
```

### Step 4: Backend Checks Session
```php
// Laravel checks session cookie
$user = Auth::user();

if (!$user) {
  return response()->json(['message' => 'Unauthenticated'], 401);
}

// Session valid, return user
return response()->json([
    'user' => [/* user data */]
]);
```

### Step 5: Frontend Restores State
```typescript
const userData = response.data.user;
setUser(userData);
setIsAuthenticated(true);
setIsLoading(false);
```

### Step 6: Page Renders with Auth State Intact
```
✓ User still logged in
✓ Dashboard still accessible
✓ No re-login needed
```

---

## Key Points

### Why Session-Based?
- ✅ Stateful on server (sessions table in DB)
- ✅ HttpOnly cookies (XSS protection)
- ✅ CSRF protection built-in
- ✅ No token management needed
- ✅ Automatic expiration

### Why Fetch User on Mount?
- ✅ Persistent across page refreshes
- ✅ Survives window reload
- ✅ Works with browser back button
- ✅ Handles manual navigation

### Why ProtectedRoute Component?
- ✅ Client-side protection
- ✅ Better UX (redirect instead of 404)
- ✅ Enforce role-based access
- ✅ Show loading while checking

### Why Redirect Based on Role?
- ✅ Different dashboards for different users
- ✅ Personalized experience
- ✅ Prevents unauthorized access
- ✅ Automatic routing logic

---

**Status**: ✅ All examples production-ready
