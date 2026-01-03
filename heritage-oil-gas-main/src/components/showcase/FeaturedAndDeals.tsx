import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Star } from "lucide-react";
import api from "@/lib/api";
import { Link } from "react-router-dom";

interface HotDeal {
  id: number;
  product_id: number;
  store_id: number;
  plan_type: string;
  original_price: number;
  deal_price: number;
  discount_percentage: number;
  deal_description?: string;
  product: {
    id: number;
    name: string;
    new_price: number;
    images?: Array<{ url: string; is_primary: boolean }>;
  };
  store: {
    id: number;
    name: string;
  };
}

interface FeaturedProduct {
  id: number;
  product_id: number;
  store_id: number;
  plan_type: string;
  featured_at: string;
  product: {
    id: number;
    name: string;
    new_price: number;
    rating?: number;
    images?: Array<{ url: string; is_primary: boolean }>;
  };
  store: {
    id: number;
    name: string;
  };
}

export function FeaturedProductsSection() {
  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/featured-products?limit=8");
      setFeatured(response.data.data || response.data);
    } catch (err) {
      // console.error("Error fetching featured products:", err);
      setError("Failed to load featured products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold mb-2">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Curated selections from our top sellers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || featured.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-6 w-6 text-orange" fill="currentColor" />
            <h2 className="text-3xl font-heading font-bold">
              Featured Products
            </h2>
          </div>
          <p className="text-muted-foreground">
            Curated selections from our top sellers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((item) => {
            const primaryImage = item.product.images?.find(
              (img) => img.is_primary
            )?.url;
            const planBadgeColor = {
              platinum: "bg-purple-500",
              gold: "bg-yellow-500",
              silver: "bg-gray-400",
              basic: "bg-blue-500",
            };

            return (
              <Link
                key={item.id}
                to={`/product/${item.product.id}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative w-full h-48 bg-muted overflow-hidden">
                      {primaryImage && (
                        <img
                          src={primaryImage}
                          alt={item.product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      )}
                      <Badge
                        className={`absolute top-2 right-2 ${
                          planBadgeColor[
                            item.plan_type as keyof typeof planBadgeColor
                          ]
                        }`}
                      >
                        {item.plan_type.charAt(0).toUpperCase() +
                          item.plan_type.slice(1)}
                      </Badge>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm line-clamp-2 h-10">
                        {item.product.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-orange">
                            ₦
                            {parseFloat(String(item.product.new_price)).toFixed(
                              2
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {item.store.name}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HotDealsSection() {
  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotDeals();
  }, []);

  const fetchHotDeals = async () => {
    try {
      setLoading(true);
      const response = await api.get("/hot-deals?limit=6");
      setDeals(response.data.data || response.data);
    } catch (err) {
      // console.error("Error fetching hot deals:", err);
      setError("Failed to load hot deals");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-orange/5 border-y border-orange/20">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold mb-2">Hot Deals</h2>
            <p className="text-muted-foreground">Limited time offers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || deals.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-orange/5 border-y border-orange/20">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-6 w-6 text-orange" fill="currentColor" />
            <h2 className="text-3xl font-heading font-bold">Hot Deals</h2>
          </div>
          <p className="text-muted-foreground">
            Limited time offers with huge discounts
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => {
            const primaryImage = deal.product.images?.find(
              (img) => img.is_primary
            )?.url;

            return (
              <Link
                key={deal.id}
                to={`/product/${deal.product.id}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden relative">
                  {/* Discount Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-destructive text-white rounded-full w-14 h-14 flex items-center justify-center flex-col">
                      <span className="text-sm font-bold">
                        -{deal.discount_percentage}%
                      </span>
                      <span className="text-xs font-semibold">OFF</span>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="relative w-full h-48 bg-muted overflow-hidden">
                      {primaryImage && (
                        <img
                          src={primaryImage}
                          alt={deal.product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm line-clamp-2 h-10">
                        {deal.product.name}
                      </h3>

                      {deal.deal_description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {deal.deal_description}
                        </p>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-orange">
                            ₦{deal.deal_price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ₦{deal.original_price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-success font-semibold">
                          Save ₦
                          {(deal.original_price - deal.deal_price).toFixed(2)}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {deal.store.name}
                      </div>

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-orange hover:bg-orange-dark"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Grab Deal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
