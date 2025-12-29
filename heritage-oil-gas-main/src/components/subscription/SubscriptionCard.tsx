import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  productLimit: number;
  features: string[];
  popular?: boolean;
}

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  onSelect?: (plan: SubscriptionPlan) => void;
}

export function SubscriptionCard({ plan, onSelect }: SubscriptionCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className={`relative ${plan.popular ? "border-secondary shadow-glow" : ""}`}>
      {plan.popular && (
        <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>Up to {plan.productLimit} products</CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-4">
        <div className="mb-6">
          <span className="text-4xl font-bold font-heading text-primary">{formatPrice(plan.price)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-3 text-sm text-left">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-success" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={plan.popular ? "hero" : "outline"}
          onClick={() => onSelect?.(plan)}
        >
          Choose {plan.name}
        </Button>
      </CardFooter>
    </Card>
  );
}
