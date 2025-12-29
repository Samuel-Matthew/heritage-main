import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Your role doesn't
            have the required privileges.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate("/")} className="w-full">
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="w-full"
          >
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
