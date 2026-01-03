import React, { useState, useRef, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Fuel, Mail, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { useRateLimit } from "@/hooks/useRateLimit";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isLimited, countdown, handleRateLimitError, resetRateLimit } =
    useRateLimit();

  const checkEmailAvailability = async (email: string) => {
    try {
      const response = await api.post("/api/check-email", { email });

      if (response.data.exists) {
        setEmailError("This email is already registered");
      } else {
        setEmailError(null);
      }
    } catch (error: any) {
      if (
        error.response?.status === 422 &&
        error.response?.data?.errors?.email
      ) {
        setEmailError("This email is already registered");
      } else {
        setEmailError(null);
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));

    // Check email availability with debounce
    if (id === "email") {
      // Always clear error when user is typing
      setEmailError(null);
      setCheckingEmail(false);

      // Clear previous timeout
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }

      // Only check if email looks complete (has @ and a domain)
      if (value && value.includes("@") && value.includes(".")) {
        emailCheckTimeoutRef.current = setTimeout(() => {
          checkEmailAvailability(value);
        }, 800); // Wait 800ms after user stops typing before checking
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for email error before submitting
    if (emailError) {
      toast.error(emailError);
      return;
    }

    // Add client-side validation
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last names are required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      toast.error("You must agree to the terms");
      return;
    }

    setLoading(true);
    try {
      // console.log("Fetching CSRF token...");
      await api.get("/sanctum/csrf-cookie");

      // Wait a moment for the cookie to be set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // console.log("CSRF token fetched successfully");
      // console.log("Available cookies:", document.cookie);

      // console.log("Submitting registration...", {
      //   name: `${form.firstName} ${form.lastName}`,
      //   email: form.email,
      //   phone: form.phone,
      // });

      const response = await api.post("/api/register", {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      // console.log("Registration response status:", response.status);
      // console.log("Registration response data:", response.data);
      // console.log("Full response object:", response);

      if (response.status === 200 && response.data?.user) {
        // Clear browser cache and cookies to prevent stale responses
        // console.log("[REGISTER] Clearing browser cache and storage...");

        // Clear sessionStorage and localStorage
        sessionStorage.clear();
        localStorage.clear();

        // Clear all cookies more aggressively
        const clearCookie = (name: string) => {
          // Try multiple path variations
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

        // Clear specific Laravel/auth cookies
        const cookiesToClear = [
          "XSRF-TOKEN",
          "laravel_session",
          "LARAVEL_SESSION",
          "remember_me",
        ];

        cookiesToClear.forEach((cookie) => clearCookie(cookie));

        // Also clear any cookie we find
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
          if (name && !cookiesToClear.includes(name)) {
            clearCookie(name);
          }
        });

        // console.log("[REGISTER] Cache and cookies cleared successfully");

        // Show verification modal instead of redirecting
        setRegisteredEmail(form.email);
        setShowVerificationModal(true);

        toast.success(
          "Account created! Check your email to verify your account."
        );
      } else {
        // console.warn("Unexpected response status or missing user data");
        toast.error(
          "Registration may have failed - please check your email and try logging in"
        );
        navigate("/login");
      }
    } catch (error: any) {
      // console.error("Registration error:", error);
      // console.error("Error response:", error.response?.data);
      // console.error("Error status:", error.response?.status);

      // Handle rate limit error (HTTP 429)
      if (error.status === 429 || error.isRateLimited) {
        handleRateLimitError(
          error.retryAfter || 60,
          error.message ||
            "Too many registration attempts. Please try again later."
        );
        toast.error(
          `⚠️ Too Many Attempts - Wait ${
            error.retryAfter || 60
          } seconds before trying again`
        );
        setLoading(false);
        return;
      }

      // Ensure loading is false before showing errors
      setLoading(false);

      // Handle validation errors (422)
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        // console.log("Validation errors found:", errors);

        // Check for email already exists error
        if (errors.email) {
          const emailErrors = Array.isArray(errors.email)
            ? errors.email
            : [errors.email];
          const emailError = emailErrors[0];
          // console.log("Email error detected:", emailError);

          if (
            emailError?.toLowerCase().includes("already") ||
            emailError?.toLowerCase().includes("unique")
          ) {
            toast.error(
              "This email is already registered. Please sign in instead."
            );
            setTimeout(() => navigate("/login"), 1500);
            return;
          }

          toast.error(emailError || "Invalid email");
          return;
        }

        // Handle other field errors
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey];
        const errorMessage = Array.isArray(firstError)
          ? firstError[0]
          : firstError;
        toast.error(errorMessage || "Validation failed");
        return;
      }

      // Handle server errors (500)
      if (error.response?.status === 500) {
        const errorMsg =
          error.response.data?.message ||
          error.response.data?.error ||
          "Internal server error";
        toast.error("Server error: " + errorMsg);
        // console.error("Server error details:", error.response.data);
      } else if (error.response?.status === 419) {
        toast.error("CSRF token mismatch - please try again");
      } else if (error.response?.status === 422) {
        toast.error("Validation error - please check your details");
      } else if (error.message) {
        toast.error("Registration failed: " + error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join Nigeria's #1 Oil & Gas Marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={emailError ? "border-red-500" : ""}
                  disabled={checkingEmail}
                />
                {checkingEmail && (
                  <p className="text-sm text-gray-500">
                    Checking email availability...
                  </p>
                )}
                {emailError && (
                  <p className="text-sm text-red-500">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  value={form.password}
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(v) => setAgreeTerms(Boolean(v))}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  loading || emailError !== null || checkingEmail || isLimited
                }
              >
                {loading
                  ? "Creating account..."
                  : isLimited
                  ? `Wait ${countdown}s`
                  : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/seller/register"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Want to sell? Register as a Seller →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Email Verification Modal */}
        <Dialog
          open={showVerificationModal}
          onOpenChange={setShowVerificationModal}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <DialogTitle>Check Your Email</DialogTitle>
              <DialogDescription className="text-base">
                We've sent a verification link to
              </DialogDescription>
            </DialogHeader>

            <div className="text-center space-y-4">
              <p className="font-semibold text-lg">{registeredEmail}</p>

              <p className="text-sm text-gray-600">
                Click the link in your email to verify your account and complete
                registration.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  What's next?
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Check your email (including spam folder)</li>
                  <li>✓ Click the verification link</li>
                  {/* <li>✓ Return here to log in</li> */}
                </ul>
              </div>

              <div className="space-y-3 pt-4">
                {/* <Button
                  onClick={() => {
                    setShowVerificationModal(false);
                    navigate("/login");
                  }}
                  className="w-full"
                >
                  Go to Login
                </Button> */}

                <Button
                  onClick={() =>
                    window.open("https://mail.google.com", "_blank")
                  }
                  className="w-full"
                >
                  Open Gmail
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or try
                registering again.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Register;
