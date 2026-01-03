import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProductCard, Product } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const categoryParam = searchParams.get("category");
    return categoryParam ? [decodeURIComponent(categoryParam)] : [];
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/category-counts");
        const categoryNames = Object.keys(response.data).sort();
        setAvailableCategories(categoryNames);
      } catch (error) {
        // console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Update searchQuery when URL parameters change
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) {
      setSearchQuery(decodeURIComponent(qParam));
    } else {
      setSearchQuery("");
    }
  }, [searchParams]);

  // Fetch products from API on mount and when search changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        // Build query params
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);

        const response = await api.get(`/api/products?${params.toString()}`);

        // Handle both paginated and non-paginated responses
        const productsData = response.data.data || response.data;
        const productsList = Array.isArray(productsData)
          ? productsData
          : [productsData];

        // Transform API data to Product format
        const products = productsList.map((product: any) => ({
          id: product.id?.toString(),
          name: product.name,
          category: product.category?.name || "Uncategorized",
          description: product.description,
          // price: product.new_price || 0,
          // wholesalePrice: product.old_price,
          image: getImageUrl(
            product.images?.[0]?.image_path || product.images?.[0]?.path
          ),
          store: {
            name: product.store?.name || "N/A",
            id: product.store?.id?.toString() || "0",
          },
          inStock: product.status === "active",
          rating: 4.5,
          reviews: 0,
        }));

        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  const filteredProducts = allProducts.filter((product) => {
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(product.category)
    ) {
      return false;
    }

    return true;
  });

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-heading font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {availableCategories.length > 0 ? (
            availableCategories.map((cat) => (
              <div key={cat} className="flex items-center gap-2">
                <Checkbox
                  id={cat}
                  checked={selectedCategories.includes(cat)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, cat]);
                    } else {
                      setSelectedCategories(
                        selectedCategories.filter((c) => c !== cat)
                      );
                    }
                  }}
                />
                <Label htmlFor={cat} className="text-sm cursor-pointer">
                  {cat}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No categories available
            </p>
          )}
        </div>
      </div>

      {/* Price removed - products do not expose price in this view */}

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSelectedCategories([]);
        }}
      >
        Clear All Filters
      </Button>
    </div>
  );

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
            <span className="text-foreground">Products</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            All Products
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse {filteredProducts.length} products from verified sellers
          </p>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterSidebar />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="name">Product Name</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setSelectedCategories(
                        selectedCategories.filter((c) => c !== cat)
                      )
                    }
                  >
                    {cat}
                    <X className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="w-full aspect-square bg-muted rounded-t-lg" />
                    <CardContent className="pt-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No products found matching your criteria.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategories([]);
                  }}
                >
                  Clear all filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Products;
