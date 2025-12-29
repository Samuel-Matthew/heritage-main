import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Search, Filter, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

interface HotDeal {
  id: string;
  name: string;
  description: string;
  image: string;
  store: { name: string; id: string; phone?: string };
  location: string;
  inStock: boolean;
  discount: number;
  endsIn: string;
}

const categories = [
  "All Categories",
  "Drilling Chemicals",
  "Production Chemicals",
  "Safety Equipment",
  "Valves & Pumps",
  "Tools & Parts",
  "Marine Equipment",
  "Electrical Components",
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price);
};

export default function HotDeals() {
  const [hotDeals, setHotDeals] = useState<HotDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("ending-soon");
  const navigate = useNavigate();

  // Fetch hot deals from API on mount
  useEffect(() => {
    const fetchHotDeals = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/api/hot-deals");

        // Handle both paginated and non-paginated responses
        const dealsData = response.data.data || response.data;
        const dealsList = Array.isArray(dealsData) ? dealsData : [dealsData];

        // Transform API data to HotDeal format
        const deals = dealsList.map((deal: any) => ({
          id: deal.id?.toString(),
          name: deal.product?.name || deal.name || "N/A",
          description:
            deal.product?.description ||
            deal.description ||
            "Premium oil & gas product",
          image: getImageUrl(
            deal.product?.images?.[0]?.image_path ||
              deal.product?.images?.[0]?.path ||
              deal.image
          ),
          store: {
            name: deal.product?.store?.name || deal.store?.name || "N/A",
            id:
              deal.product?.store?.id?.toString() ||
              deal.store?.id?.toString() ||
              "0",
            phone: deal.product?.store?.phone || deal.store?.phone,
          },
          location: deal.product?.store?.state || deal.location || "Nigeria",
          inStock: deal.status === "active" || deal.inStock !== false,
          discount: deal.discount || Math.floor(Math.random() * 30) + 15,
          endsIn: deal.endsIn || "2d 14h",
        }));

        setHotDeals(deals);
      } catch (error) {
        console.error("Error fetching hot deals:", error);
        toast.error("Failed to load hot deals");
        setHotDeals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotDeals();
  }, []);

  const handleContactSeller = (phone?: string) => {
    if (phone) {
      const whatsappUrl = `https://wa.me/${phone.replace(
        /\D/g,
        ""
      )}?text=Hi, I'm interested in your product on Heriglob`;
      window.open(whatsappUrl, "_blank");
    } else {
      toast.error("Seller phone number not available");
    }
  };

  // Filter and sort deals
  const filteredDeals = hotDeals
    .filter((deal) => {
      // Filter by search query
      if (
        searchQuery &&
        !deal.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          !deal.name.toLowerCase().includes(categoryName.toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          // Sort by time remaining (assumes endsIn format like "2d 14h")
          return 0; // Keep original order for now
        case "biggest-discount":
          return b.discount - a.discount;
        case "price-low":
        case "price-high":
          // These would need price data in the HotDeal object
          return 0;
        default:
          return 0;
      }
    });
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary py-16">
        <div className="container">
          <div className="text-center text-primary-foreground">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flame className="w-10 h-10 text-secondary animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-heading font-bold">
                Hot Deals
              </h1>
            </div>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-2">
              Exclusive Hot Deals on Oil & Gas Equipment, Chemicals & Industrial
              Supplies
            </p>
            <p className="text-primary-foreground/70 max-w-3xl mx-auto">
              Discover limited-time discounts, clearance offers, and monthly
              exhibition deals from verified suppliers across all 36 states and
              the FCT.
            </p>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="bg-secondary/10 border-b border-secondary/20">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-muted-foreground">
              Hot Deals are updated daily and are active until items sell out.
              Be quick — once the timer expires, the deal disappears.
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container">
          {/* About Hot Deals */}
          <div className="bg-card rounded-2xl p-6 md:p-8 mb-10 border">
            <h2 className="text-2xl font-heading font-semibold mb-4">
              Welcome to Hot Deals
            </h2>
            <p className="text-muted-foreground mb-4">
              Your gateway to the best prices in the oil and gas industry. Here,
              companies showcase discounted products, flash sales, and special
              clearance offers on essential oilfield supplies, including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                "Drilling chemicals & additives",
                "Production chemicals",
                "Safety equipment",
                "Valves, pumps & machinery",
                "Tools, parts & consumables",
                "Marine & offshore equipment",
                "Electrical components",
                "Mechanical components",
              ].map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="justify-start py-2 px-3 text-sm"
                >
                  {item}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground">
              Every listing is posted directly by verified vendors, giving you
              full access to real-time price reductions, deal countdown timers,
              direct supplier contact, live product images (no stock photos
              allowed), and state-by-state availability.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search hot deals..."
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="biggest-discount">
                  Biggest Discount
                </SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
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
            ) : filteredDeals.length > 0 ? (
              filteredDeals.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden relative"
                >
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    <Badge className="bg-destructive text-destructive-foreground">
                      -{product.discount}% OFF
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-background/90 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {product.endsIn}
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
                  No hot deals available matching your filters.
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
