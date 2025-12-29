import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleBasedRedirect } from "@/lib/roleUtils";

/**
 * Component that redirects root path (/) to appropriate dashboard based on user role
 */
export function RootRedirect() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      // Redirect to login on the main app
      window.location.href =
        import.meta.env.VITE_MAIN_APP_URL || "http://localhost:8080";
      return;
    }

    // Redirect based on user role
    const redirectUrl = getRoleBasedRedirect(user.role);
    if (redirectUrl.startsWith("http")) {
      window.location.href = redirectUrl;
    } else {
      navigate(redirectUrl, { replace: true });
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  // Show loading state while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}
