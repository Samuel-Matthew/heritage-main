# Role-Based Authentication - Visual Reference Guide

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                              │
│                   heritage-oil-gas-main (Port 5173)                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    AuthProvider Wrapper                         │ │
│  │  (manages all auth state and provides useAuth() hook)          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Login Page                              │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │ Email:    [____________]                            │  │   │
│  │  │ Password: [____________]                            │  │   │
│  │  │           [Sign In Button]                          │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  On Submit:                                              │   │
│  │  1. useAuth().login(email, password)                    │   │
│  │  2. POST /api/login → Backend                           │   │
│  │  3. Get user + role back                                │   │
│  │  4. getRoleBasedRedirect(role) → gets dashboard URL     │   │
│  │  5. navigate(redirectUrl)                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────┬────────────────────────────┐    │
│  │                                │                            │    │
│  ▼                                ▼                            ▼    │
│ ┌──────────────┐          ┌─────────────────┐       ┌──────────────┐
│ │ Admin User   │          │  Seller User    │       │  Buyer User  │
│ │ (super_admin)│          │ (store_owner)   │       │   (buyer)    │
│ └──────────────┘          │                 │       │              │
│        │                  └─────────────────┘       └──────────────┘
│        │                         │                         │
│        │ Redirect to             │ Redirect to             │ Redirect to
│        │ /admin/dashboard        │ heritage-dashboards     │ /
│        │                         │ (external app)          │
│        ▼                         ▼                         ▼
│   ┌─────────────┐          ┌────────────┐           ┌────────┐
│   │AdminDashboard          │SellerDash  │           │ Home   │
│   │(Protected)  │          │(External)  │           │Page    │
│   └─────────────┘          └────────────┘           └────────┘
│        │                                                   │
│        └───────────────┬────────────────────────────────┬─┘
│                        │                                │
│                        └─ useAuth() hook available
│                           to get current user
│
└──────────────────────────────────────────────────────────────────────┘
                                    ▲
                          HTTP Requests with
                          Session Cookie +
                          CSRF Token
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Laravel)                               │
│                   heritage-oil-gas-main-backend                      │
│                        (Port 8000)                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Routes: routes/auth.php                                    │   │
│  │                                                            │   │
│  │ POST   /api/login    → store()                            │   │
│  │ GET    /api/user     → getUser()                          │   │
│  │ POST   /api/logout   → destroy()                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ AuthenticatedSessionController                             │   │
│  │                                                            │   │
│  │ store(LoginRequest $request):                             │   │
│  │   - Validate credentials                                  │   │
│  │   - Create session                                        │   │
│  │   - Return user { id, name, email, phone, role }         │   │
│  │                                                            │   │
│  │ getUser(Request $request):                                │   │
│  │   - Check session cookie                                  │   │
│  │   - Return user if authenticated                          │   │
│  │   - Return 401 if not                                     │   │
│  │                                                            │   │
│  │ destroy(Request $request):                                │   │
│  │   - Clear session                                         │   │
│  │   - Return 204                                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Database                                                   │   │
│  │                                                            │   │
│  │ users table:                                              │   │
│  │ ├─ id                                                     │   │
│  │ ├─ name                                                   │   │
│  │ ├─ email                                                  │   │
│  │ ├─ password (hashed)                                      │   │
│  │ ├─ phone                                                  │   │
│  │ ├─ role enum: 'super_admin', 'store_owner', 'buyer'     │   │
│  │ └─ timestamps                                             │   │
│  │                                                            │   │
│  │ sessions table:                                           │   │
│  │ ├─ id (session token)                                     │   │
│  │ ├─ user_id                                                │   │
│  │ ├─ ip_address                                             │   │
│  │ ├─ user_agent                                             │   │
│  │ ├─ payload (serialized data)                              │   │
│  │ └─ last_activity                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Login Process

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Enters Credentials                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Email:    admin@example.com                                         │
│ Password: secret123                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Frontend Sends Request                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ handleLogin() →                                                    │
│   login(email, password) →  // useAuth hook                        │
│     api.post('/api/login', { email, password })                    │
│                                                                     │
│ POST http://localhost:8000/api/login                              │
│ Content-Type: application/json                                     │
│ X-XSRF-TOKEN: (auto-added by axios interceptor)                   │
│                                                                     │
│ Body:                                                              │
│ {                                                                  │
│   "email": "admin@example.com",                                    │
│   "password": "secret123"                                          │
│ }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Backend Validates                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ AuthenticatedSessionController::store()                            │
│   ├─ LoginRequest::authenticate()                                  │
│   │  └─ Check if email+password match database                    │
│   │     (uses Hash::check for password)                            │
│   │                                                                │
│   ├─ If valid:                                                    │
│   │  ├─ $request->session()->regenerate()                         │
│   │  │  (Creates new session ID)                                  │
│   │  │                                                            │
│   │  └─ Auth::user() → Get authenticated user                     │
│   │                                                               │
│   └─ If invalid:                                                 │
│      └─ Throw ValidationException                                 │
│         (422 Unprocessable Entity)                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Backend Returns User + Creates Cookie                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ HTTP 200 OK                                                         │
│ Set-Cookie: XSRF-TOKEN=...; Path=/; HttpOnly                       │
│ Set-Cookie: (Laravel session); Path=/; HttpOnly; SameSite=Strict  │
│                                                                     │
│ Response Body:                                                      │
│ {                                                                  │
│   "message": "Logged in successfully",                             │
│   "user": {                                                        │
│     "id": 1,                                                       │
│     "name": "Admin User",                                          │
│     "email": "admin@example.com",                                  │
│     "phone": "+1234567890",                                        │
│     "role": "super_admin"                                          │
│   }                                                                │
│ }                                                                  │
│                                                                     │
│ Browser automatically stores cookies (HttpOnly, can't be accessed │
│ via JavaScript for security)                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Frontend Stores User in Context                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ AuthContext:                                                        │
│   setUser({                                                         │
│     id: 1,                                                          │
│     name: "Admin User",                                             │
│     email: "admin@example.com",                                     │
│     phone: "+1234567890",                                           │
│     role: "super_admin"                                             │
│   })                                                                │
│   setIsAuthenticated(true)                                          │
│                                                                     │
│ This state now available via useAuth() to all components           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: Get Redirect URL Based on Role                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ getRoleBasedRedirect("super_admin")                                 │
│   ├─ if role === "super_admin"                                    │
│   │  └─ return "/admin/dashboard"                                  │
│   ├─ if role === "store_owner"                                    │
│   │  └─ return "http://localhost:5174/"                            │
│   └─ if role === "buyer"                                          │
│      └─ return "/"                                                 │
│                                                                     │
│ Result: "/admin/dashboard"                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 7: Frontend Navigates                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ navigate("/admin/dashboard", { replace: true })                    │
│                                                                     │
│ URL changes: http://localhost:5173/admin/dashboard                │
│                                                                     │
│ React Router renders:                                               │
│   <ProtectedRoute requiredRoles="super_admin">                     │
│     <AdminDashboard />                                              │
│   </ProtectedRoute>                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 8: Protected Route Validates Access                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ProtectedRoute checks:                                              │
│   ✓ isLoading === false (finished fetching)                        │
│   ✓ isAuthenticated === true (user logged in)                      │
│   ✓ user !== null (user exists)                                    │
│   ✓ user.role ("super_admin") in requiredRoles (["super_admin"]) │
│                                                                     │
│ All checks pass! → Render AdminDashboard component                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 9: Dashboard Rendered                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ AdminDashboard component:                                           │
│   ├─ Access user data: const { user } = useAuth()                  │
│   ├─ Show: "Welcome, Admin User!"                                  │
│   ├─ Display admin-specific features                               │
│   ├─ Can call logout() from useAuth()                              │
│   └─ All protected features accessible                             │
│                                                                     │
│ ✅ User is now logged in with admin privileges                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Page Refresh (Session Persistence)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER REFRESHES PAGE (F5)                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Current URL: http://localhost:5173/admin/dashboard                │
│ Browser cookies (stored by browser, not accessible in JS):        │
│   - XSRF-TOKEN: ...                                                │
│   - Laravel Session: ...                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: React App Reloads                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ AuthContext component mounts                                        │
│ Initial state:                                                      │
│   user = null                                                       │
│   isLoading = true                                                  │
│   isAuthenticated = false                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: useEffect Runs                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ useEffect(() => {                                                  │
│   fetchUser();  // Called on mount                                  │
│ }, [])                                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Frontend Calls GET /api/user                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ fetchUser() →                                                      │
│   api.get('/api/user')                                              │
│                                                                     │
│ GET http://localhost:8000/api/user                                │
│ (Browser automatically includes cookies in request)                │
│                                                                     │
│ Request includes:                                                  │
│   Cookie: XSRF-TOKEN=...; Laravel session=...                     │
│   X-XSRF-TOKEN: (auto-added by interceptor)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Backend Checks Session                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ AuthenticatedSessionController::getUser()                          │
│                                                                     │
│ $user = Auth::user();                                               │
│   ├─ Laravel checks session cookie                                 │
│   ├─ Looks up session in sessions table                            │
│   ├─ Gets user_id from session                                     │
│   ├─ Queries users table for user                                  │
│   └─ Returns user or null                                          │
│                                                                     │
│ Case 1: Session valid                                              │
│   └─ return user data (HTTP 200)                                   │
│                                                                     │
│ Case 2: Session expired/invalid                                    │
│   └─ return error (HTTP 401)                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5A: Session Valid - Return User                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ HTTP 200 OK                                                         │
│ {                                                                  │
│   "user": {                                                        │
│     "id": 1,                                                       │
│     "name": "Admin User",                                          │
│     "email": "admin@example.com",                                  │
│     "phone": "+1234567890",                                        │
│     "role": "super_admin"                                          │
│   }                                                                │
│ }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5B: Session Invalid - Return 401                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ HTTP 401 Unauthorized                                               │
│ {                                                                  │
│   "message": "Unauthenticated"                                     │
│ }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼ (Valid Session)             ▼ (Invalid Session)
        ┌─────────────────────────┐   ┌──────────────────────┐
        │ STEP 6A: Restore Auth   │   │ STEP 6B: Clear Auth  │
        ├─────────────────────────┤   ├──────────────────────┤
        │                         │   │                      │
        │ AuthContext:            │   │ AuthContext:         │
        │   setUser(userData)      │   │   setUser(null)      │
        │   setAuthenticated(true) │   │   setAuthenticated   │
        │   setLoading(false)      │   │   (false)            │
        │                         │   │   setLoading(false)  │
        └─────────────────────────┘   └──────────────────────┘
                 │                             │
                 ▼                             ▼
        ┌─────────────────────────┐   ┌──────────────────────┐
        │ STEP 7A: Page Renders   │   │ STEP 7B: Redirect    │
        ├─────────────────────────┤   ├──────────────────────┤
        │                         │   │                      │
        │ ProtectedRoute sees:    │   │ ProtectedRoute       │
        │   - isLoading = false   │   │ checks:              │
        │   - isAuthenticated =   │   │   - isAuthenticated  │
        │     true                │   │     = false          │
        │   - user.role = admin   │   │                      │
        │                         │   │ Action:              │
        │ All checks pass!        │   │   navigate("/login") │
        │ Renders AdminDashboard  │   │                      │
        │                         │   │ Redirects user to    │
        │ ✅ Session Persisted!  │   │ login page           │
        └─────────────────────────┘   └──────────────────────┘
```

---

## Protected Route Decision Tree

```
┌─────────────────────────────────────────────┐
│ User Tries to Access Protected Route        │
│ e.g., /admin/dashboard                      │
└─────────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ ProtectedRoute Component    │
        │ Receives requiredRoles:     │
        │ "super_admin"               │
        └─────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ isLoading === true?          │
        └─────────────────────────────┘
           │                    │
          YES                   NO
           │                    │
           ▼                    ▼
      ┌────────────┐   ┌──────────────────┐
      │ Show       │   │ isAuthenticated? │
      │ spinner    │   │ && user exists?  │
      │ loading... │   └──────────────────┘
      └────────────┘      │          │
                         YES        NO
                          │         │
                          ▼         ▼
                    ┌──────────┐  ┌────────────┐
                    │ requiredR│  │ Redirect   │
                    │ oles?    │  │ to fallback│
                    └──────────┘  │ route      │
                       │  │       │ (/login)   │
                      YES NO      └────────────┘
                       │  │
                       │  └─ Render component
                       │     ✅ All checks pass
                       │
                       ▼
                ┌──────────────────┐
                │ User.role in     │
                │ requiredRoles?   │
                └──────────────────┘
                   │          │
                  YES        NO
                   │         │
                   ▼         ▼
              ┌────────┐  ┌────────────┐
              │ Render │  │ Redirect   │
              │ Child  │  │ to fallback│
              │Compnent│  │ route      │
              │✅OK    │  │ (/login)   │
              └────────┘  └────────────┘
```

---

## Role Matrix - Who Can Access What

```
┌─────────────────────────────────────────────────────────────┐
│ Role                │ Can Access              │ Redirects To  │
├─────────────────────────────────────────────────────────────┤
│ super_admin         │ /admin/dashboard        │ /admin/dash   │
│                     │ Any route if allowed    │               │
├─────────────────────────────────────────────────────────────┤
│ store_owner         │ heritage-dashboards     │ heritage-app  │
│ (seller)            │ Public pages            │ or home       │
│                     │ /admin/* → BLOCKED      │ (/login)      │
├─────────────────────────────────────────────────────────────┤
│ buyer               │ Public pages (/)        │ /             │
│                     │ /admin/* → BLOCKED      │ (/login)      │
│                     │ /seller/* → BLOCKED     │ (/login)      │
├─────────────────────────────────────────────────────────────┤
│ Anonymous/No Auth   │ Public pages only       │ /             │
│                     │ /login, /register       │ (/login)      │
│                     │ Protected routes        │               │
│                     │ → BLOCKED               │               │
└─────────────────────────────────────────────────────────────┘
```

---

## Cookie Lifecycle

```
┌─────────────────────────────────────────────┐
│ STEP 1: Login                               │
├─────────────────────────────────────────────┤
│                                             │
│ Backend sets cookies in response:          │
│   Set-Cookie: XSRF-TOKEN=...;              │
│   Set-Cookie: laravel_session=...;         │
│   (Both HttpOnly, SameSite=Strict)         │
│                                             │
│ Browser automatically stores them          │
│ (JavaScript cannot access HttpOnly)        │
│                                             │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ STEP 2: Subsequent Requests                │
├─────────────────────────────────────────────┤
│                                             │
│ Browser automatically includes cookies:    │
│   GET /api/user                            │
│   Headers:                                  │
│     Cookie: XSRF-TOKEN=...                 │
│     Cookie: laravel_session=...            │
│     X-XSRF-TOKEN: ... (added by axios)    │
│                                             │
│ Backend validates cookies                  │
│ If valid → Return user data                │
│ If invalid → Return 401                    │
│                                             │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ STEP 3: Logout                              │
├─────────────────────────────────────────────┤
│                                             │
│ POST /api/logout                           │
│   (Includes current cookies)               │
│                                             │
│ Backend:                                    │
│   - Invalidates session                    │
│   - Regenerates token                      │
│                                             │
│ Browser can keep cookies (now invalid)     │
│ Next request with expired cookies          │
│   → Backend returns 401                    │
│   → Frontend redirects to /login           │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Visual Guide Created**: December 17, 2025
