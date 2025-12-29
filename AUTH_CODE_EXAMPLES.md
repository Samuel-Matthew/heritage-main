# Complete Code Examples - Role-Based Auth

## 1. Backend Login Controller Response

**File**: `heritage-oil-gas-main-backend/app/Http/Controllers/Auth/AuthenticatedSessionController.php`

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
                'role' => $user->role,  // ← Returns role
            ]
        ]);
    }

    /**
     * Get the authenticated user.
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
                'role' => $user->role,  // ← Returns role
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

## 2. Frontend Auth Context

**File**: `heritage-dashboards/src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export type UserRole = 'super_admin' | 'store_owner' | 'buyer';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create API instance with credentials
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,  // ← Include cookies
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
});

// Add CSRF token interceptor
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  return config;
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user on mount for session persistence
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async (): Promise<AuthUser | null> => {
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
        fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 3. Protected Route Component

**File**: `heritage-dashboards/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  fallbackRoute?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  fallbackRoute = '/login',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // Check role if required
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
```

---

## 4. Role-Based Route Setup

**File**: `heritage-dashboards/src/App.tsx` (excerpt)

```typescript
<BrowserRouter>
  <Routes>
    {/* Admin Only Routes */}
    <Route
      element={
        <ProtectedRoute requiredRoles="super_admin">
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Dashboard />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/users" element={<Users />} />
      <Route path="/products" element={<Products />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<SystemSettings />} />
    </Route>

    {/* Store Owner Routes */}
    <Route
      element={
        <ProtectedRoute requiredRoles="store_owner">
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/my-store" element={<MyStore />} />
      <Route path="/products" element={<Products />} />
      <Route path="/documents" element={<Documents />} />
    </Route>

    {/* Shared Authenticated Routes */}
    <Route
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/profile" element={<Profile />} />
    </Route>

    {/* Public Routes */}
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

---

## 5. Login Handler with Axios

**File**: `heritage-oil-gas-main/src/pages/Login.tsx` (excerpt)

```typescript
import { useAuth } from "@/contexts/AuthContext";
import { getRoleBasedRedirect } from "@/lib/roleUtils";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      // Call login from AuthContext
      const userData = await login(email, password);

      toast({
        title: "Success",
        description: `Welcome back, ${userData.name}!`,
      });

      // Get redirect URL based on role
      const redirectUrl = getRoleBasedRedirect(userData.role);
      
      // If redirecting to another app, use full URL
      if (redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
      } else {
        navigate(redirectUrl, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <Input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};
```

---

## 6. Role Utilities

**File**: `src/lib/roleUtils.ts`

```typescript
import { UserRole } from '@/contexts/AuthContext';

/**
 * Determine redirect URL based on user role after login
 */
export const getRoleBasedRedirect = (role: UserRole): string => {
  const dashboardAppUrl = import.meta.env.VITE_DASHBOARD_APP_URL || 'http://localhost:5174';
  
  switch (role) {
    case 'super_admin':
      return `${dashboardAppUrl}/`;
    case 'store_owner':
      return `${dashboardAppUrl}/my-store`;
    case 'buyer':
      return '/';
    default:
      return '/';
  }
};

/**
 * Check if user has required role(s)
 */
export const hasRole = (userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

/**
 * Role-specific checks
 */
export const isAdmin = (role: UserRole): boolean => role === 'super_admin';
export const isSeller = (role: UserRole): boolean => role === 'store_owner';
export const isBuyer = (role: UserRole): boolean => role === 'buyer';
```

---

## 7. Using Auth in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, isSeller } from '@/lib/roleUtils';

export function DashboardHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header>
      <div className="flex items-center justify-between">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p>{user.email}</p>
        </div>
        
        {/* Show role-specific UI */}
        {isAdmin(user.role) && (
          <div>Admin Controls</div>
        )}
        
        {isSeller(user.role) && (
          <div>Seller Controls</div>
        )}
        
        <button onClick={() => logout()}>Logout</button>
      </div>
    </header>
  );
}
```

---

## 8. Backend Role Validation (Important!)

**File**: `heritage-oil-gas-main-backend/app/Http/Middleware/CheckRole.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(
        Request $request,
        Closure $next,
        string $role
    ): Response {
        if (!$request->user() || $request->user()->role !== $role) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
```

**Usage in routes:**
```php
Route::middleware(['auth', 'role:super_admin'])->group(function () {
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::post('/admin/users', [UserController::class, 'store']);
});

Route::middleware(['auth', 'role:store_owner'])->group(function () {
    Route::get('/store/products', [ProductController::class, 'index']);
});
```

---

## 9. Environment Configuration

### Heritage Oil Gas Main (.env)
```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_DASHBOARD_APP_URL=http://localhost:5174
```

### Heritage Dashboards (.env)
```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_MAIN_APP_URL=http://localhost:8080
```

### Backend (.env)
```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:8080
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost:8080,localhost:5174
```

---

## 10. Session Persistence Flow Diagram

```
Page Load/Refresh
    ↓
AuthProvider mounts
    ↓
useEffect runs fetchUser()
    ↓
GET /api/user (with session cookie)
    ↓
Backend reads session cookie
    ↓
Returns authenticated user + role
    ↓
React Context updated with user
    ↓
isLoading → false
    ↓
Routes can now check auth + role
    ↓
User stays logged in!
```

