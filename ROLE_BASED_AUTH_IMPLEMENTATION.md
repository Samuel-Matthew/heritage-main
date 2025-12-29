# Role-Based Authentication Implementation Summary

## ✅ Implemented Features

### 1. Backend (Laravel Sanctum)
- ✅ Login endpoint returns authenticated user with role
- ✅ User endpoint returns current authenticated user
- ✅ Session-based authentication with CSRF protection
- ✅ Database-driven sessions
- ✅ CORS configured for cross-app communication

### 2. Frontend Authentication
- ✅ AuthContext in both apps
- ✅ Session persistence (fetches user on app load)
- ✅ Login/logout functions
- ✅ Loading states

### 3. Role-Based Route Protection
- ✅ ProtectedRoute component prevents unauthorized access
- ✅ Role checking middleware
- ✅ Unauthorized error page (404)
- ✅ Automatic redirects based on role

### 4. Dashboard Integration
- ✅ Admin → heritage-dashboards app (super_admin only)
- ✅ Seller → heritage-dashboards/my-store (store_owner only)
- ✅ Buyer → main site home (/)
- ✅ All routes protected by role

---

## 🎯 Login Flow

```
User Login (Main Site)
    ↓
POST /api/login [email, password]
    ↓
Backend validates credentials
    ↓
Backend creates session + returns user with role
    ↓
Frontend AuthContext stores user
    ↓
getRoleBasedRedirect(role) determines destination:
    - super_admin → http://localhost:5174/
    - store_owner → http://localhost:5174/my-store
    - buyer → http://localhost:8080/
    ↓
Redirect user
```

---

## 🔐 Dashboard Protection

### Admin Dashboard Routes (Super Admin Only)
```
/ (Dashboard home)
/stores
/users
/products
/categories
/exhibitions
/reports
/audit-logs
/settings
/subscriptions
/documents
```

### Seller Dashboard Routes (Store Owner Only)
```
/my-store
/products
/categories
/documents
```

### Shared Routes (All Authenticated)
```
/profile
```

---

## 📂 Files Modified/Created

### Heritage Oil Gas Main
- ✅ `src/contexts/AuthContext.tsx` - Auth state management
- ✅ `src/lib/roleUtils.ts` - Role utilities and redirects
- ✅ `src/components/ProtectedRoute.tsx` - Route protection component
- ✅ `src/pages/Login.tsx` - Updated with role-based redirect

### Heritage Dashboards
- ✅ `src/contexts/AuthContext.tsx` - Backend integration
- ✅ `src/lib/roleUtils.ts` - Dashboard-specific redirects
- ✅ `src/components/ProtectedRoute.tsx` - Route protection
- ✅ `src/components/layout/TopBar.tsx` - Updated with logout
- ✅ `src/pages/Unauthorized.tsx` - 403 error page
- ✅ `src/App.tsx` - Role-based route setup

### Backend
- ✅ `app/Http/Controllers/Auth/AuthenticatedSessionController.php` - Returns user + role
- ✅ `routes/auth.php` - Added /api/user endpoint

---

## 🌐 Session Persistence

When user refreshes page:
1. Frontend calls `GET /api/user` (AuthProvider useEffect)
2. Backend reads session cookie and returns authenticated user
3. AuthContext restores user state
4. Route protection works immediately
5. No need for manual login after page refresh

---

## 🔧 Configuration

### Environment Variables (.env)

**Heritage Oil Gas Main:**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_DASHBOARD_APP_URL=http://localhost:5174
```

**Heritage Dashboards:**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_MAIN_APP_URL=http://localhost:8080
```

---

## 🧪 Testing Role-Based Access

### Create Test Users (SQL)
```sql
-- Admin
INSERT INTO users (name, email, phone, password, role) 
VALUES ('Admin User', 'admin@test.com', NULL, bcrypt('password'), 'super_admin');

-- Seller
INSERT INTO users (name, email, phone, password, role) 
VALUES ('Store Owner', 'seller@test.com', '+234812345678', bcrypt('password'), 'store_owner');

-- Buyer
INSERT INTO users (name, email, phone, password, role) 
VALUES ('Buyer User', 'buyer@test.com', NULL, bcrypt('password'), 'buyer');
```

### Test Scenarios

1. **Admin Login**
   - Email: admin@test.com
   - Should redirect to dashboard home
   - Can access all dashboard routes

2. **Seller Login**
   - Email: seller@test.com
   - Should redirect to /my-store
   - Can only access seller routes
   - Trying /stores → redirects to /unauthorized

3. **Buyer Login**
   - Email: buyer@test.com
   - Should redirect to main site /
   - Cannot access dashboard (will 401 if tries)

---

## 🔒 Security Features

✅ **Implemented:**
- Session-based authentication (stateful)
- CSRF token protection (automatic via axios)
- HttpOnly session cookies
- Frontend role validation
- Backend must validate on API calls
- Unauthorized error page

⚠️ **Important:** Backend MUST validate roles on protected endpoints

---

## 🚀 How to Use

### For New Admin Routes
```typescript
<Route
  element={
    <ProtectedRoute requiredRoles="super_admin">
      <MainLayout />
    </ProtectedRoute>
  }
>
  <Route path="/new-page" element={<NewPage />} />
</Route>
```

### For Multiple Role Routes
```typescript
<Route
  element={
    <ProtectedRoute requiredRoles={['super_admin', 'store_owner']}>
      <MainLayout />
    </ProtectedRoute>
  }
>
  <Route path="/page" element={<Page />} />
</Route>
```

### Using User Data in Components
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  return <div>Welcome, {user?.name}!</div>;
}
```

### Using Role Utils
```typescript
import { isAdmin, isSeller, hasRole } from '@/lib/roleUtils';

if (isAdmin(user.role)) {
  // Show admin features
}

if (hasRole(user.role, ['super_admin', 'store_owner'])) {
  // Show for admins and sellers
}
```

---

## ⚡ Quick Start

### 1. Start Backend
```bash
cd heritage-oil-gas-main-backend
php artisan serve
# Runs on http://localhost:8000
```

### 2. Start Main Site
```bash
cd heritage-oil-gas-main
npm run dev
# Runs on http://localhost:8080 or similar
```

### 3. Start Dashboard
```bash
cd heritage-dashboards
npm run dev
# Runs on http://localhost:5174
```

### 4. Test Login
- Go to main site login
- Enter test user credentials
- Should redirect to appropriate dashboard based on role

---

## 📋 Checklist

- ✅ Backend returns user + role on login
- ✅ Frontend persists auth on page refresh
- ✅ Role-based redirects work
- ✅ Dashboard routes protected by role
- ✅ Seller can only access seller pages
- ✅ Admin can access all pages
- ✅ Buyer cannot access dashboard
- ✅ Logout clears auth state
- ✅ Unauthorized page shows for role mismatch
- ✅ Loading states shown during auth check

---

## 🎓 Key Concepts

### Session-Based Auth
- User logs in once
- Server creates session
- Session ID stored in HttpOnly cookie
- Cookie sent automatically with requests
- User stays logged in until logout or session expires

### Role-Based Access Control (RBAC)
- Each user has a role (super_admin, store_owner, buyer)
- Routes check user's role before rendering
- User redirected if role doesn't match
- Multiple roles can be allowed for a single route

### Auth Context
- React Context API stores auth state
- Available throughout app via useAuth()
- Automatically fetches user on app load
- Updates when user logs in/out

### Protected Routes
- HOC wrapper around routes
- Checks authentication before rendering
- Checks user role before rendering
- Shows loading state while checking auth
- Redirects to error/login if not authorized

