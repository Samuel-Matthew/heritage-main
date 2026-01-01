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
import { useRateLimit } from "@/hooks/useRateLimit";
import { getRoleBasedRedirect } from "@/lib/roleUtils";

interface LoginProps {
  isSeller?: boolean;
}

const Login = ({ isSeller = false }: LoginProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, user } = useAuth();
  const { isLimited, countdown, handleRateLimitError, resetRateLimit } =
    useRateLimit();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  // Email validation helper
  const validateEmail = (value: string): string | null => {
    if (!value) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return null;
  };

  // Password validation helper
  const validatePassword = (value: string): string | null => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      setEmailError(validateEmail(value));
    } else {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      setPasswordError(validatePassword(value));
    } else {
      setPasswordError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      toast({
        title: "Invalid Email",
        description: emailValidationError,
        variant: "destructive",
      });
      return;
    }

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      toast({
        title: "Invalid Password",
        description: passwordValidationError,
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

      // Handle rate limit error (HTTP 429)
      if (error.status === 429 || error.isRateLimited) {
        handleRateLimitError(
          error.retryAfter || 60,
          error.message || "Too many login attempts. Please try again later."
        );
        toast({
          title: "⚠️ Too Many Attempts",
          description: `Please wait ${
            error.retryAfter || 60
          } seconds before trying again`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Handle validation errors (422 - wrong credentials)
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors || {};
        const message = error.response?.data?.message || "";

        // Check for password-specific errors FIRST (priority over email)
        if (errors.password) {
          const passwordErrorMsg = Array.isArray(errors.password)
            ? errors.password[0]
            : errors.password;
          setPasswordError(passwordErrorMsg);
          toast({
            title: "❌ Wrong Password",
            description:
              passwordErrorMsg ||
              "The password you entered is incorrect. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Check for email-specific errors
        if (errors.email) {
          const emailErrorMsg = Array.isArray(errors.email)
            ? errors.email[0]
            : errors.email;

          // If the error message suggests wrong password (user exists but credentials don't match)
          if (
            emailErrorMsg.toLowerCase().includes("password") ||
            message.toLowerCase().includes("password") ||
            message.toLowerCase().includes("credentials") ||
            message.toLowerCase().includes("match")
          ) {
            setPasswordError("The password you entered is incorrect");
            toast({
              title: "❌ Wrong Password",
              description:
                "The password you entered is incorrect. Please try again.",
              variant: "destructive",
            });
          } else {
            // Actual email not found
            setEmailError(emailErrorMsg);
            toast({
              title: "❌ Email Not Found",
              description:
                emailErrorMsg ||
                "This email is not registered. Please check and try again.",
              variant: "destructive",
            });
          }
          setIsLoading(false);
          return;
        }

        // Handle generic "credentials do not match" error
        if (
          message.toLowerCase().includes("credentials") ||
          message.toLowerCase().includes("match") ||
          message.toLowerCase().includes("password")
        ) {
          // When backend says credentials don't match, it's a wrong password
          setPasswordError("The password you entered is incorrect");
          toast({
            title: "❌ Wrong Password",
            description:
              "The password you entered is incorrect. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Generic validation error
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey];
        const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
        toast({
          title: "❌ Validation Error",
          description: errorMsg || "Please check your details and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Handle other errors
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
                  onChange={handleEmailChange}
                  disabled={isLoading || isLimited}
                  className={
                    emailError ? "border-red-500 focus:ring-red-500" : ""
                  }
                />
                {emailError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    ✕ {emailError}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading || isLimited}
                    className={
                      passwordError ? "border-red-500 focus:ring-red-500" : ""
                    }
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
                {passwordError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    ✕ {passwordError}
                  </p>
                )}
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
                disabled={
                  isLoading || isLimited || !!emailError || !!passwordError
                }
              >
                {isLoading
                  ? "Signing in..."
                  : isLimited
                  ? `Wait ${countdown}s`
                  : "Sign In"}
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
