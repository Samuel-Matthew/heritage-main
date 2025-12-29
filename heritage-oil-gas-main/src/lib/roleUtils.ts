import { UserRole } from '@/contexts/AuthContext';

/**
 * Get the redirect URL based on user role
 * Used after successful login to redirect to appropriate dashboard
 * 
 * Note: Buyer and Seller dashboards are in the heritage-dashboards app
 * Admin dashboard remains in this app at /admin/dashboard
 */
export const getRoleBasedRedirect = (role: UserRole): string => {
  const dashboardAppUrl = import.meta.env.VITE_DASHBOARD_APP_URL || 'http://localhost:5174';
  
  switch (role) {
    case 'super_admin':
      // Admin redirects to admin dashboard in dashboard app
      return `${dashboardAppUrl}/admin/dashboard`;
    case 'store_owner':
      // Seller redirects to seller dashboard in dashboard app
      return `${dashboardAppUrl}/seller/dashboard`;
    case 'buyer':
      // Buyers stay on main site home
      return '/';
    default:
      return '/';
  }
};

/**
 * Check if user has required role(s)
 * @param userRole - The user's current role
 * @param requiredRoles - Role(s) required to access resource
 * @returns true if user has required role
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

/**
 * Check if user is buyer
 */
export const isBuyer = (role: UserRole): boolean => role === 'buyer';
