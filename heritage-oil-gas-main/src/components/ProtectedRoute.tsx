import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole | UserRole[];
  fallbackRoute?: string;
}

/**
 * ProtectedRoute Component
 *
 * Prevents unauthorized access to routes based on authentication and role.
 * Redirects to login if not authenticated, or to fallback route if role doesn't match.
 *
 * @param children - The component to render if access is granted
 * @param requiredRoles - Role(s) required to access this route (defaults to any authenticated user)
 * @param fallbackRoute - Route to redirect to on unauthorized access (defaults to '/login')
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
  fallbackRoute = "/login",
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // Check role if required
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];
    if (!roles.includes(user.role)) {
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};
