import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Search, Filter, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

interface FeaturedProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  store: { name: string; id: string; phone?: string };
  location: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

const categories = [
  "All Categories",
  "Automotive Lubricants",
  "Industrial Lubricants",
  "Greases",
  "Fuel Products",
  "Machinery Parts",
  "Safety Equipment",
];

export default function Wholesale() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch featured products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/api/showcase");

        // Get featured products
        const featuredProductsData = response.data.featured_products || [];
        const productsList = Array.isArray(featuredProductsData)
          ? featuredProductsData
          : [featuredProductsData];

        // Transform API data to FeaturedProduct format
        const items = productsList
          .map((fp: any) => ({
            id: fp.product?.id?.toString() || fp.id?.toString(),
            name: fp.product?.name || "N/A",
            description: fp.product?.description || "Premium oil & gas product",
            image: getImageUrl(
              fp.product?.images?.[0]?.image_path ||
                fp.product?.images?.[0]?.path
            ),
            store: {
              name: fp.product?.store?.name || "N/A",
              id: fp.product?.store?.id?.toString() || "0",
              phone: fp.product?.store?.phone,
            },
            location: fp.product?.store?.state || "Nigeria",
            rating: fp.product?.rating || 4.5,
            reviews: fp.product?.reviews_count || 0,
            inStock: fp.product?.status === "active",
          }))
          .slice(0, 12); // Limit to 12 featured products

        setProducts(items);
      } catch (error) {
        // console.error("Error fetching products:", error);
        toast.error("Failed to load featured products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleContactSeller = (phone?: string) => {
    if (phone) {
      const whatsappUrl = `https://wa.me/${phone.replace(
        /\D/g,
        ""
      )}?text=Hi, I'm interested in your featured product on Heriglob`;
      window.open(whatsappUrl, "_blank");
    } else {
      toast.error("Seller phone number not available");
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Filter by search query
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    // Filter by category (skip "All Categories")
    if (selectedCategory !== "all") {
      const categoryName = categories.find(
        (cat) => cat.toLowerCase().replace(/\s/g, "-") === selectedCategory
      );
      if (
        categoryName &&
        !product.name.toLowerCase().includes(categoryName.toLowerCase())
      ) {
        return false;
      }
    }
    return true;
  });
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary py-16">
        <div className="container">
          <div className="text-center text-primary-foreground">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-10 h-10 text-secondary" />
              <h1 className="text-4xl md:text-5xl font-heading font-bold">
                Featured Products
              </h1>
            </div>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-2">
              Handpicked Oil & Gas Products & Services
            </p>
            <p className="text-primary-foreground/70 max-w-3xl mx-auto">
              Discover our curated selection of premium products from verified
              suppliers across Nigeria.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-secondary/10 py-8 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Quality Assured", desc: "Only the best products" },
              { title: "Verified Sellers", desc: "All suppliers verified" },
              { title: "Direct Contact", desc: "Connect with sellers easily" },
              { title: "Best Prices", desc: "Competitive rates" },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="flex items-start gap-3 p-4 bg-background rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container">
          {/* About Featured Products */}
          <div className="bg-card rounded-2xl p-6 md:p-8 mb-10 border">
            <h2 className="text-2xl font-heading font-semibold mb-4">
              Welcome to Featured Products
            </h2>
            <p className="text-muted-foreground mb-4">
              Our Featured Products section showcases the best-performing and
              most popular items from verified suppliers. Each product is
              carefully selected based on quality, availability, and customer
              demand.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Lubricants",
                "Chemicals",
                "Equipment",
                "Safety Gear",
                "Machinery",
                "Tools",
                "Parts",
                "Accessories",
              ].map((item) => (
                <Badge key={item} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search featured products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat.toLowerCase().replace(/\s/g, "-")}
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="pt-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden relative"
                >
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  </div>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => handleContactSeller(product.store.phone)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Contact Seller
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <Link
                      to={`/store/${product.store.id}`}
                      className="text-xs text-muted-foreground hover:text-secondary transition-colors"
                    >
                      {product.store.name}
                    </Link>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-medium text-sm mt-1 line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-12 text-center">
                <p className="text-muted-foreground">
                  No featured products available matching your filters.
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
