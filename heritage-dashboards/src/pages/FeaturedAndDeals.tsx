import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Flame,
  Star,
  Calendar,
  DollarSign,
  Percent,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: number;
  name: string;
  new_price: number;
  old_price?: number;
  status: string;
}

interface FeaturedProduct {
  id: number;
  product_id: number;
  product: Product;
  plan_type: string;
  featured_at: string;
}

interface HotDeal {
  id: number;
  product_id: number;
  product: Product;
  plan_type: string;
  original_price: number;
  deal_price: number;
  discount_percentage: number;
  deal_start_at: string;
  deal_end_at: string;
  deal_description?: string;
}

interface FeaturedAndDealsData {
  featured_products: FeaturedProduct[];
  hot_deals: HotDeal[];
  plan_type: string;
  featured_slots_used: number;
  featured_slots_max: number;
  hot_deals_used: number;
  hot_deals_max: number;
}

export default function FeaturedAndDeals() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [data, setData] = useState<FeaturedAndDealsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [dealForm, setDealForm] = useState({
    product_id: "",
    deal_price: "",
    deal_start_at: "",
    deal_end_at: "",
    deal_description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, dataRes] = await Promise.all([
        api.get("/products"),
        api.get("/featured-and-deals"),
      ]);

      setProducts(productsRes.data.data || productsRes.data);
      setData(dataRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureProduct = async (productId: number) => {
    try {
      await api.post(`/products/${productId}/feature`);
      toast.success("Product featured successfully");
      fetchData();
      setDialogOpen(false);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to feature product";
      toast.error(message);
    }
  };

  const handleUnfeatureProduct = async (productId: number) => {
    try {
      await api.delete(`/products/${productId}/unfeature`);
      toast.success("Product unfeatures successfully");
      fetchData();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to unfeature product";
      toast.error(message);
    }
  };

  const handleCreateHotDeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !dealForm.product_id ||
      !dealForm.deal_price ||
      !dealForm.deal_start_at ||
      !dealForm.deal_end_at
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/hot-deals", {
        product_id: dealForm.product_id,
        deal_price: parseFloat(dealForm.deal_price),
        deal_start_at: dealForm.deal_start_at,
        deal_end_at: dealForm.deal_end_at,
        deal_description: dealForm.deal_description || null,
      });

      toast.success("Hot deal created successfully");
      setDealForm({
        product_id: "",
        deal_price: "",
        deal_start_at: "",
        deal_end_at: "",
        deal_description: "",
      });
      setDealDialogOpen(false);
      fetchData();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create hot deal";
      toast.error(message);
    }
  };

  const handleEndHotDeal = async (dealId: number) => {
    try {
      await api.delete(`/hot-deals/${dealId}`);
      toast.success("Hot deal ended successfully");
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to end hot deal";
      toast.error(message);
    }
  };

  const getPlanBadgeVariant = (planType: string) => {
    return (
      {
        platinum: "bg-purple-500 text-white",
        gold: "bg-yellow-500 text-white",
        silver: "bg-gray-400 text-white",
        basic: "bg-blue-500 text-white",
      }[planType] || "bg-gray-500 text-white"
    );
  };

  const getAvailableProducts = () => {
    const featuredIds = new Set(
      data?.featured_products.map((f) => f.product_id) || []
    );
    const dealIds = new Set(data?.hot_deals.map((d) => d.product_id) || []);

    return products.filter(
      (p) =>
        p.status === "active" && !featuredIds.has(p.id) && !dealIds.has(p.id)
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Featured Products & Hot Deals
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your featured products and hot deals to increase visibility
        </p>
      </div>

      {/* Plan Info */}
      <Card className="border-orange/20 bg-orange/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-orange" />
                <span className="font-semibold">Featured Products</span>
              </div>
              <p className="text-2xl font-bold">
                {data.featured_slots_used}/{data.featured_slots_max}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.featured_slots_max - data.featured_slots_used} slots
                available
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-destructive" />
                <span className="font-semibold">Hot Deals</span>
              </div>
              <p className="text-2xl font-bold">
                {data.hot_deals_used}/{data.hot_deals_max}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.hot_deals_max - data.hot_deals_used} deals available
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Badge
              variant="outline"
              className={getPlanBadgeVariant(data.plan_type)}
            >
              {data.plan_type.charAt(0).toUpperCase() + data.plan_type.slice(1)}{" "}
              Plan
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="featured" className="space-y-4">
        <TabsList>
          <TabsTrigger value="featured">
            <Star className="h-4 w-4 mr-2" />
            Featured Products ({data.featured_products.length})
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Flame className="h-4 w-4 mr-2" />
            Hot Deals ({data.hot_deals.length})
          </TabsTrigger>
        </TabsList>

        {/* Featured Products Tab */}
        <TabsContent value="featured" className="space-y-4">
          <Button onClick={() => setDialogOpen(true)}>
            <Star className="h-4 w-4 mr-2" />
            Feature a Product
          </Button>

          {data.featured_products.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No featured products yet. Feature a product to increase
                  visibility.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Featured At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.featured_products.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product.name}
                      </TableCell>
                      <TableCell>
                        ₦{parseFloat(String(item.product.new_price)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeVariant(item.plan_type)}>
                          {item.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.featured_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUnfeatureProduct(item.product.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Hot Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <Button onClick={() => setDealDialogOpen(true)}>
            <Flame className="h-4 w-4 mr-2" />
            Create Hot Deal
          </Button>

          {data.hot_deals.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  No active hot deals. Create a deal to attract customers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Original Price</TableHead>
                    <TableHead>Deal Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.hot_deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">
                        {deal.product.name}
                      </TableCell>
                      <TableCell>₦{deal.original_price.toFixed(2)}</TableCell>
                      <TableCell className="text-orange font-semibold">
                        ₦{deal.deal_price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Percent className="h-3 w-3 mr-1" />
                          {deal.discount_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {new Date(deal.deal_start_at).toLocaleDateString()}
                          </div>
                          <div className="text-muted-foreground">
                            to {new Date(deal.deal_end_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEndHotDeal(deal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Feature Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature a Product</DialogTitle>
            <DialogDescription>
              Select a product to feature on the homepage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {getAvailableProducts().length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                You've used all available featured slots for your plan.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getAvailableProducts().map((product) => (
                  <div
                    key={product.id}
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      handleFeatureProduct(product.id);
                    }}
                  >
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ₦{parseFloat(String(product.new_price)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Hot Deal Dialog */}
      <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Hot Deal</DialogTitle>
            <DialogDescription>
              Set up a limited time offer to attract customers
            </DialogDescription>
          </DialogHeader>

          {getAvailableProducts().length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              You've used all available hot deal slots for your plan.
            </p>
          ) : (
            <form onSubmit={handleCreateHotDeal} className="space-y-4">
              <div>
                <Label htmlFor="product_id">Product</Label>
                <select
                  id="product_id"
                  value={dealForm.product_id}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, product_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select a product</option>
                  {getAvailableProducts().map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="deal_price">Deal Price</Label>
                <Input
                  id="deal_price"
                  type="number"
                  step="0.01"
                  placeholder="Enter deal price"
                  value={dealForm.deal_price}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, deal_price: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deal_start_at">Start Date & Time</Label>
                  <Input
                    id="deal_start_at"
                    type="datetime-local"
                    value={dealForm.deal_start_at}
                    onChange={(e) =>
                      setDealForm({
                        ...dealForm,
                        deal_start_at: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="deal_end_at">End Date & Time</Label>
                  <Input
                    id="deal_end_at"
                    type="datetime-local"
                    value={dealForm.deal_end_at}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, deal_end_at: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deal_description">Description (Optional)</Label>
                <Input
                  id="deal_description"
                  placeholder="e.g., 'Limited stock available'"
                  value={dealForm.deal_description}
                  onChange={(e) =>
                    setDealForm({
                      ...dealForm,
                      deal_description: e.target.value,
                    })
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                Create Hot Deal
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
