import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
import { Fuel, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token || !email) {
      toast({
        title: "❌ Invalid Link",
        description: "Password reset link is missing. Please try again.",
        variant: "destructive",
      });
      setTokenValid(false);
      return;
    }

    // Set token as valid - we'll verify it when the user submits the form
    setTokenValid(true);
  }, [token, email]);

  const verifyToken = async () => {
    try {
      const response = await api.post("/api/verify-reset-token", {
        token,
        email,
      });

      if (response.status === 200) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast({
          title: "❌ Invalid or Expired Link",
          description:
            "This password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // console.error("Token verification error:", error);
      setTokenValid(false);

      if (error.response?.status === 422) {
        toast({
          title: "❌ Invalid or Expired Link",
          description:
            "This password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Error",
          description: "Unable to verify reset link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Password validation
  const validatePassword = (value: string): string | null => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain uppercase letter";
    if (!/[a-z]/.test(value)) return "Password must contain lowercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain a number";
    return null;
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

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value) {
      if (value !== password) {
        setConfirmError("Passwords do not match");
      } else {
        setConfirmError(null);
      }
    } else {
      setConfirmError(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/api/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      if (response.status === 200) {
        setResetSuccess(true);
        toast({
          title: "✅ Password Reset",
          description: "Your password has been successfully reset",
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error: any) {
      // console.error("Reset password error:", error);

      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors || {};

        if (errors.password) {
          const passwordErrorMsg = Array.isArray(errors.password)
            ? errors.password[0]
            : errors.password;
          setPasswordError(passwordErrorMsg);
          toast({
            title: "Invalid Password",
            description: passwordErrorMsg,
            variant: "destructive",
          });
        } else if (errors.token) {
          toast({
            title: "❌ Invalid or Expired Link",
            description:
              "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive",
          });
        } else {
          const firstErrorKey = Object.keys(errors)[0];
          const firstError = errors[firstErrorKey];
          const errorMsg = Array.isArray(firstError)
            ? firstError[0]
            : firstError;
          toast({
            title: "Error",
            description: errorMsg || "Unable to reset password",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Unable to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <MainLayout hideFooter>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Invalid Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-6 text-center">
                This password reset link is invalid or has expired.
              </p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (resetSuccess) {
    return (
      <MainLayout hideFooter>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Password Reset Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-6 text-center">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hideFooter>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-14 h-14 mx-auto rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Fuel className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Create New Password</CardTitle>
            <CardDescription>
              Enter your new password below to complete the reset process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
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
                <p className="text-xs text-gray-600">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={isLoading}
                    className={
                      confirmError ? "border-red-500 focus:ring-red-500" : ""
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    ✕ {confirmError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || !!passwordError || !!confirmError}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
