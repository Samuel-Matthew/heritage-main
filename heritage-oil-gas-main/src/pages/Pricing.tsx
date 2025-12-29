import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SubscriptionCard, SubscriptionPlan } from "@/components/subscription/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 5000,
    productLimit: 5,
    features: [
      "List up to 5 products",
      "Store profile page",
      "Direct buyer chat",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 7500,
    productLimit: 10,
    popular: true,
    features: [
      "List up to 10 products",
      "Store profile page",
      "Direct buyer chat",
      "Advanced analytics",
      "Priority support",
      "Featured in search",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 12000,
    productLimit: 20,
    features: [
      "List up to 20 products",
      "Store profile page",
      "Direct buyer chat",
      "Full analytics suite",
      "24/7 priority support",
      "Featured in search",
      "Homepage spotlight",
    ],
  },
];

const Pricing = () => {
  return (
    <MainLayout>
      <div className="gradient-hero text-primary-foreground py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Choose the plan that fits your business. All plans include a verified store profile and direct buyer communication.
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <SubscriptionCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to start selling? Register your store first.
          </p>
          <Button size="lg" variant="hero" asChild>
            <Link to="/seller/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Pricing;
