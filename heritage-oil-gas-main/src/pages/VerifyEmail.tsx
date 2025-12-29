import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader, Mail } from "lucide-react";
import api from "@/lib/api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const id = searchParams.get("id");
        const hash = searchParams.get("hash");

        if (!id || !hash) {
          setError("Invalid verification link. Missing parameters.");
          setIsVerifying(false);
          return;
        }

        console.log("[VERIFY] Verifying email with:", { id, hash });

        // Call the backend verification endpoint
        const response = await api.get(`/api/verify-email/${id}/${hash}`);

        console.log("[VERIFY] Verification response:", response);

        setIsSuccess(true);
        setShowSuccessModal(true);
        toast.success("Email verified successfully!");
      } catch (err: any) {
        console.error("[VERIFY] Verification error:", err);

        if (err.response?.status === 401) {
          setError("Session expired. Please log in first.");
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(
            "Failed to verify email. The link may be expired or invalid."
          );
        }

        toast.error("Verification failed");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <MainLayout hideFooter>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {isVerifying ? (
              <>
                <Loader className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                <CardTitle>Verifying Your Email</CardTitle>
                <CardDescription>
                  Please wait while we verify your email address...
                </CardDescription>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <CardTitle>Email Verified!</CardTitle>
                <CardDescription>
                  Your account has been successfully verified.
                </CardDescription>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <CardTitle>Verification Failed</CardTitle>
                <CardDescription>{error}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center space-y-4">
            {!isVerifying && !isSuccess && (
              <Button onClick={() => navigate("/login")} className="w-full">
                Go to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl">
              Email Verified Successfully!
            </DialogTitle>
            <DialogDescription>
              Your email address has been verified. You can now log in to your
              account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Next step:</strong> Click the button below to proceed to
                login and access your account.
              </p>
            </div>

            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/login");
              }}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
