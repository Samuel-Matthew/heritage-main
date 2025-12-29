import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Fuel, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleBasedRedirect } from "@/lib/roleUtils";

interface LoginProps {
  isSeller?: boolean;
}

const Login = ({ isSeller = false }: LoginProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Clear old session cookies on page load (from registration)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromRegistration = urlParams.get("from") === "register";

    if (fromRegistration) {
      console.log("[LOGIN] Clearing old session cookies...");
      // Clear session storage and old cookies
      sessionStorage.clear();

      const clearCookie = (name: string) => {
        const paths = ["/", "//", window.location.pathname];
        const domains = [
          "",
          window.location.hostname,
          "." + window.location.hostname,
        ];

        paths.forEach((path) => {
          domains.forEach((domain) => {
            const cookieStr = domain
              ? `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path};domain=${domain}`
              : `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}`;
            document.cookie = cookieStr;
          });
        });
      };

      [
        "XSRF-TOKEN",
        "laravel_session",
        "LARAVEL_SESSION",
        "remember_me",
      ].forEach((cookie) => clearCookie(cookie));
      console.log("[LOGIN] Old session cookies cleared");
    }
  }, []);

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

      if (!userData) {
        throw new Error("No user data returned from login");
      }

      toast({
        title: "Success",
        description: `Welcome back, ${userData.name}!`,
      });

      // Redirect based on role
      const redirectUrl = getRoleBasedRedirect(userData.role);

      console.log("Login redirect:", {
        redirectUrl,
        startsWithHttp: redirectUrl.startsWith("http"),
      });

      // Use window.location for cross-domain redirects, navigate for same-domain
      if (redirectUrl.startsWith("http")) {
        console.log("Using window.location.href for cross-domain redirect");
        window.location.href = redirectUrl;
      } else {
        console.log("Using navigate for same-domain redirect");
        navigate(redirectUrl, { replace: true });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Login failed. Please try again.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout hideFooter>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-14 h-14 mx-auto rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Fuel className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {isSeller ? "Seller Login" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSeller
                ? "Sign in to manage your store on Heriglob"
                : "Sign in to your Heriglob account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              {isSeller ? (
                <Link
                  to="/seller/register"
                  className="text-primary font-medium hover:underline"
                >
                  Register as Seller
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </Link>
              )}
            </div>
            {!isSeller && (
              <div className="mt-4 text-center">
                <Link
                  to="/seller/login"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Seller Login →
                </Link>
              </div>
            )}
            {isSeller && (
              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  ← Buyer Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Login;
