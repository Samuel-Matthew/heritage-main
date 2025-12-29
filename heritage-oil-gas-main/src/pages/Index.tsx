import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard, Product } from "@/components/products/ProductCard";
import { StoreCard, Store } from "@/components/stores/StoreCard";
import {
  HotDealsSection,
  FeaturedProductsSection,
} from "@/components/showcase/FeaturedAndDeals";
import {
  ArrowRight,
  Droplets,
  Cog,
  Fuel,
  ShieldCheck,
  Package,
  Truck,
  CheckCircle,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

// Mock data
const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Shell Helix Ultra 5W-40 Fully Synthetic Motor Oil - 4L",
    price: 28500,
    wholesalePrice: 24000,
    image:
      "https://images.unsplash.com/photo-1635784063388-1ff609731d7d?w=400&h=400&fit=crop",
    category: "Automotive Lubricants",
    store: { name: "PetroChem Supplies", id: "1" },
    rating: 4.8,
    reviews: 156,
    inStock: true,
    minOrder: 5,
  },
];

const topStores: Store[] = [
  {
    id: "1",
    name: "PetroChem Supplies",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
    description:
      "Leading supplier of petroleum products and automotive lubricants in Lagos.",
    location: "Lagos, Nigeria",
    rating: 4.9,
    reviews: 342,
    productCount: 48,
    status: "active",
    verified: true,
  },
];

const categories = [
  {
    name: "Automotive Lubricants",
    icon: Droplets,
    count: 1250,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Industrial Lubricants",
    icon: Cog,
    count: 890,
    color: "from-slate-500 to-slate-600",
  },
  {
    name: "Greases",
    icon: Package,
    count: 456,
    color: "from-amber-500 to-amber-600",
  },
  {
    name: "Fuel Products",
    icon: Fuel,
    count: 234,
    color: "from-red-500 to-red-600",
  },
  {
    name: "Machinery Parts",
    icon: Cog,
    count: 678,
    color: "from-zinc-500 to-zinc-600",
  },
  {
    name: "Safety Equipment",
    icon: ShieldCheck,
    count: 345,
    color: "from-green-500 to-green-600",
  },
];

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topStores, setTopStores] = useState<Store[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch featured products and top stores on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch category counts and showcase data in parallel
        const [countsResponse, showcaseResponse] = await Promise.all([
          api.get("/api/category-counts"),
          api.get("/api/showcase"),
        ]);

        // Set category counts from database
        setCategoryCounts(countsResponse.data);

        // Transform featured products for ProductCard
        const products =
          showcaseResponse.data.featured_products?.map((fp: any) => ({
            id: fp.product?.id?.toString() || fp.id?.toString(),
            name: fp.product?.name || "N/A",
            price: fp.product?.new_price || 0,
            wholesalePrice: fp.product?.old_price,
            image: getImageUrl(
              fp.product?.images?.[0]?.image_path ||
                fp.product?.images?.[0]?.path
            ),
            category: fp.product?.category || "N/A",
            store: {
              name: fp.product?.store?.name || "N/A",
              id: fp.product?.store?.id?.toString() || "0",
            },
            rating: 4.5,
            reviews: 0,
            inStock: true,
          })) || [];

        setFeaturedProducts(products.slice(0, 4)); // Limit to 4 for homepage

        // Fetch top stores with accurate product counts
        try {
          const storesResponse = await api.get(
            "/api/stores?per_page=50&sort=products_count"
          );
          const stores = storesResponse.data.data || storesResponse.data;

          const topStoresList = (Array.isArray(stores) ? stores : [stores])
            .map((store: any) => {
              // Use state + country, or just state, or address, or default to Nigeria
              const location =
                store.state && store.country
                  ? `${store.state}, ${store.country}`
                  : store.state
                  ? `${store.state}, Nigeria`
                  : store.address || "Nigeria";

              // Use company logo from documents if available, otherwise generate placeholder
              let logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                store.name
              )}&background=4F46E5&color=fff&bold=true`;

              if (store.company_logo) {
                logo = getImageUrl(store.company_logo);
              }

              return {
                id: store.id?.toString(),
                name: store.name || "N/A",
                logo: logo,
                description: store.description || "Premium oil & gas supplier",
                location: location,
                rating: store.rating || 4.5,
                reviews: store.reviews_count || 0,
                productCount: store.products_count || store.total_products || 0,
                status: store.status || "active",
                verified: store.is_verified || store.verified || true,
              };
            })
            .sort(
              (a: any, b: any) => (b.productCount || 0) - (a.productCount || 0)
            )
            .slice(0, 3);

          setTopStores(topStoresList);
        } catch (error) {
          console.error("Error fetching top stores:", error);
          setTopStores([]);
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
        toast.error("Failed to load homepage data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl animate-slide-up">
            <Badge variant="secondary" className="mb-4">
              🔥 Nigeria's #1 Oil & Gas Marketplace
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
              Your Trusted Source for
              <span className="block text-secondary">
                Oil & Gas Products and Services
              </span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Connect with verified suppliers of lubricants, fuel products,
              machinery parts, and safety equipment. Shop wholesale or retail
              with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="hero-outline" asChild>
                <Link to="/seller/register">Become a Seller</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 w-1/3 h-full hidden lg:block">
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-32 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-card border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Package, label: "Products", value: "5,000+" },
              { icon: Users, label: "Verified Sellers", value: "500+" },
              { icon: TrendingUp, label: "Monthly Orders", value: "10K+" },
              { icon: Star, label: "Customer Rating", value: "4.8/5" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Deals Section */}
      <HotDealsSection />

      {/* Featured Products Section */}
      <FeaturedProductsSection />

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">
                Shop by Category
              </h2>
              <p className="text-muted-foreground mt-1">
                Find exactly what you need
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/products">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
              >
                <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <cat.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-medium text-sm">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {categoryCounts[cat.name] || 0} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">
                Featured Products
              </h2>
              <p className="text-muted-foreground mt-1">
                Top picks from our marketplace
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/featured">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">
              Why Choose Heriglob?
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              We connect buyers with verified suppliers, ensuring quality
              products and reliable service
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Verified Sellers",
                description:
                  "All sellers go through a rigorous verification process including CAC registration and identity verification.",
              },
              {
                icon: Truck,
                title: "Fast Delivery",
                description:
                  "Connect directly with local suppliers for quick delivery across Nigeria.",
              },
              {
                icon: ShieldCheck,
                title: "Secure Transactions",
                description:
                  "Safe communication and transparent dealings between buyers and sellers.",
              },
            ].map((feature, i) => (
              <Card key={i} className="text-center p-6">
                <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Stores */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">
                Top Stores
              </h2>
              <p className="text-muted-foreground mt-1">
                Shop from our best-rated sellers
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/stores">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 gradient-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of verified sellers on Nigeria's leading oil & gas
            marketplace. Reach thousands of buyers and grow your business.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="xl" variant="secondary" asChild>
              <Link to="/seller/register">
                Start Selling Today
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="hero-outline" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
