import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { StoreCard, Store } from "@/components/stores/StoreCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

const Stores = () => {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stores from API on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);

        // Fetch stores data
        const storesResponse = await api.get("/api/stores");

        // Handle both paginated and non-paginated responses
        const storesData = storesResponse.data.data || storesResponse.data;
        const storesList = Array.isArray(storesData)
          ? storesData
          : [storesData];

        // Transform API data to Store format
        const stores = storesList.map((store: any) => {
          // Use company logo from documents if available, otherwise generate placeholder
          let logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            store.name
          )}&background=4F46E5&color=fff&bold=true`;

          if (store.company_logo) {
            logo = getImageUrl(store.company_logo);
          }

          return {
            id: store.id?.toString(),
            name: store.name,
            logo: logo,
            description: store.description || "",
            location: store.state || "Nigeria",
            rating: store.rating || 4.5,
            reviews: store.reviews_count || 0,
            productCount: store.products_count || 0, // Use the count from database
            status: store.status || "approved",
            verified: store.status === "approved",
          };
        });

        // Filter to show only verified/approved stores
        const verifiedStores = stores.filter((s) => s.verified);
        setAllStores(verifiedStores);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores");
        setAllStores([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const filteredStores = allStores
    .filter((store) => {
      if (
        searchQuery &&
        !store.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (
        location &&
        !store.location.toLowerCase().includes(location.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "reviews":
          return b.reviews - a.reviews;
        case "products":
          return b.productCount - a.productCount;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-muted/50 border-b">
        <div className="container py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Stores</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Browse Stores
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover verified sellers in the oil & gas industry
          </p>
        </div>
      </div>

      <div className="container py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search stores..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative min-w-[200px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Location..."
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="rating">Highest Rated</SelectItem> */}
                  {/* <SelectItem value="reviews">Most Reviews</SelectItem> */}
                  <SelectItem value="products">Most Products</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredStores.length} stores
        </p>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-t-lg" />
                <CardContent className="pt-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No stores found matching your criteria.
            </p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setLocation("");
              }}
            >
              Clear filters
            </Button>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Stores;
