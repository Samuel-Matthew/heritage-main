import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Fuel, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit } from "@/hooks/useRateLimit";
import api from "@/lib/api";

const ForgotPassword = () => {
  const { toast } = useToast();
  const { isLimited, countdown, handleRateLimitError } = useRateLimit();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  // Email validation
  const validateEmail = (value: string): string | null => {
    if (!value) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
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

  const handleForgotPassword = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    try {
      const response = await api.post("/api/forgot-password", { email });

      if (response.status === 200) {
        setSentEmail(email);
        setShowSuccessModal(true);
        setEmail("");
        setEmailError(null);
        toast({
          title: "Check Your Email",
          description: "Password reset link has been sent to your email",
        });
      }
    } catch (error: any) {
      // console.error("Forgot password error:", error);

      // Handle rate limit error (HTTP 429)
      if (error.status === 429 || error.isRateLimited) {
        handleRateLimitError(
          error.retryAfter || 60,
          error.message ||
            "Too many password reset attempts. Please try again later."
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

      // Handle validation errors (422 - email not found or invalid)
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors || {};
        const message = error.response?.data?.message || "";

        if (errors.email) {
          const emailErrorMsg = Array.isArray(errors.email)
            ? errors.email[0]
            : errors.email;
          setEmailError(emailErrorMsg);
          toast({
            title: "❌ Email Not Found",
            description:
              emailErrorMsg ||
              "This email is not registered. Please check and try again.",
            variant: "destructive",
          });
        } else if (message) {
          toast({
            title: "❌ Error",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "❌ Error",
            description: "Unable to process your request. Please try again.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      // Handle other errors
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Unable to process your request. Please try again.";
      toast({
        title: "❌ Error",
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
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || isLimited || !!emailError}
              >
                {isLoading
                  ? "Sending..."
                  : isLimited
                  ? `Wait ${countdown}s`
                  : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <DialogTitle>Check Your Email</DialogTitle>
              <DialogDescription className="text-base">
                We've sent a password reset link to
              </DialogDescription>
            </DialogHeader>

            <div className="text-center space-y-4">
              <p className="font-semibold text-lg">{sentEmail}</p>

              <p className="text-sm text-gray-600">
                Click the link in your email to reset your password. The link
                will expire in 24 hours.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  What's next?
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Check your email (including spam folder)</li>
                  <li>✓ Click the reset password link</li>
                  <li>✓ Set your new password</li>
                  <li>✓ Return to sign in with your new password</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4">
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
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setEmail(sentEmail);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;
