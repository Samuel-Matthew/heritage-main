import { UserRole } from '@/contexts/AuthContext';

/**
 * Get redirect URL based on user role
 * This is mainly for post-login redirects
 */
export const getRoleBasedRedirect = (role: UserRole): string => {
  switch (role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'store_owner':
      return '/seller/dashboard';
    case 'buyer':
      // Buyers don't have dashboard access - redirect to main site
      const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:8080';
      window.location.href = mainAppUrl;
      return mainAppUrl;
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
 * Check if user is admin
 */
export const isAdmin = (role: UserRole): boolean => role === 'super_admin';

/**
 * Check if user is seller/store owner
 */
export const isSeller = (role: UserRole): boolean => role === 'store_owner';
