import { Link } from "react-router-dom";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";

export interface Store {
  id: string;
  name: string;
  logo: string;
  banner?: string;
  description: string;
  location: string;
  rating: number;
  reviews: number;
  productCount: number;
  status: "pending" | "active" | "suspended";
  verified: boolean;
}

interface StoreCardProps {
  store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
  const [logoLoaded, setLogoLoaded] = React.useState(false);

  return (
    <Link to={`/store/${store.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary to-secondary relative">
          {store.banner && (
            <img
              src={store.banner}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute -bottom-8 left-4">
            <div className="w-16 h-16 rounded-xl bg-card border-4 border-card overflow-hidden shadow-md flex items-center justify-center relative">
              {store.logo && (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-full h-full object-cover absolute inset-0"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoLoaded(false)}
                />
              )}
              {!logoLoaded && (
                <div className="text-xs font-semibold text-foreground text-center p-1 bg-gradient-to-br from-blue-100 to-blue-200 w-full h-full flex items-center justify-center">
                  {store.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="pt-10 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">
                  {store.name}
                </h3>
                {store.verified && (
                  <Badge variant="success" className="text-[10px]">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {store.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{store.productCount} products</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{store.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
