import { useLocation, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Clock, ArrowRight } from "lucide-react";

const RegistrationSuccess = () => {
  const location = useLocation();
  const storeId = location.state?.storeId;

  return (
    <MainLayout>
      <div className="gradient-hero text-primary-foreground py-12">
        <div className="container">
          <Badge variant="secondary" className="mb-4">
            Application Submitted
          </Badge>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            Thank You!
          </h1>
          <p className="text-primary-foreground/80">
            Your seller registration has been submitted successfully
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-12">
              <CheckCircle className="w-24 h-24 mx-auto text-success mb-6" />

              <h2 className="text-2xl font-heading font-bold mb-2">
                Application Received
              </h2>
              <p className="text-muted-foreground mb-8">
                {storeId
                  ? `Store ID: ${storeId}`
                  : "Your application has been received"}
              </p>

              <div className="space-y-4 text-left mb-8">
                <div className="flex gap-4 p-4 bg-muted rounded-lg">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Check Your Email</h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent you a confirmation email with your application
                      details
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted rounded-lg">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Review Timeline</h3>
                    <p className="text-sm text-muted-foreground">
                      Our team will review your application within 24-48 hours
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-accent/50 mb-8">
                <h3 className="font-semibold mb-3">What to expect next:</h3>
                <ol className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">1.</span>
                    <span>
                      Our team verifies your documents and business information
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">2.</span>
                    <span>
                      You'll receive an email with your approval status
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">3.</span>
                    <span>
                      Once approved, you can access your seller dashboard
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">4.</span>
                    <span>
                      Purchase a subscription plan and start listing products
                    </span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button asChild>
                  <Link to="/login">
                    Go to Login <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-muted-foreground">
            <p className="mb-2">Need help?</p>
            <Link to="/contact" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegistrationSuccess;
