import { useState, useEffect, useRef } from "react";
import { useRef as useReactRef } from "react";
// Helper for countdown
function getTimeLeft(endTime: string) {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Image as ImageIcon,
  Grid3X3,
  List,
  X,
  Star,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import api from "@/lib/api";

const categories = [
  "Automotive Lubricants",
  "Industrial Lubricants",
  "Greases",
  "Fuel Products",
  "Machinery Parts",
  "Safety Equipment",
];

interface Product {
  id: number;
  name: string;
  category: string;
  old_price?: number;
  new_price?: number;
  status: "draft" | "active" | "suspended";
  store?: string;
  image?: string | null;
  slug?: string;
  description?: string;
  created_at?: string;
  images?: Array<{
    id: number;
    image_path: string;
    is_primary?: boolean;
  }>;
  specifications?: Record<string, any> | Array<any>;
}

interface PaginatedResponse {
  data: Product[];
}

interface ImagePreview {
  file: File | null;
  url?: string;
  preview?: string;
  isExisting?: boolean;
  id?: number;
}

interface Specification {
  key: string;
  value: string;
}

// Product listing limits per plan
const PRODUCT_LIMITS = {
  basic: 0,
  silver: 5,
  gold: 10,
  platinum: 20,
};

// Featured product slots per plan
const FEATURED_SLOTS = {
  basic: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

// Hot deal slots per plan
const HOT_DEAL_SLOTS = {
  basic: 0,
  silver: 1,
  gold: 1,
  platinum: 3,
};

// Featured product duration (in days) per plan
const FEATURED_DURATION_DAYS = {
  basic: 0,
  silver: 3,
  gold: 6,
  platinum: 10,
};

// Helper to get featured expiry date
// Accepts finishTime if available, else falls back to old logic
function getFeaturedExpiry(
  featuredAt: string,
  plan: string,
  finishTime?: string
) {
  if (finishTime) {
    const expiry = new Date(finishTime);
    if (isNaN(expiry.getTime())) return null;
    return expiry;
  }
  const days = FEATURED_DURATION_DAYS[plan] || 0;
  if (!featuredAt || !days) return null;
  const start = new Date(featuredAt);
  const expiry = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return expiry;
}

export default function Products() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    old_price: 0,
    new_price: 0,
    description: "",
    status: "draft" as "draft" | "active" | "suspended",
  });
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([
    { key: "", value: "" },
  ]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isHotDeal, setIsHotDeal] = useState(false);
  const [hotDealForm, setHotDealForm] = useState({
    deal_price: "",
    deal_start_at: "",
    deal_end_at: "",
    deal_description: "",
  });
  const [featuredAndDealsData, setFeaturedAndDealsData] = useState<any>(null);
  const [productFeaturedMap, setProductFeaturedMap] = useState<
    Map<number, boolean>
  >(new Map());
  const [productHotDealMap, setProductHotDealMap] = useState<
    Map<number, boolean>
  >(new Map());

  // Promotion status state - maps product_id to promotion details
  const [promotionStatus, setPromotionStatus] = useState<Map<number, any>>(
    new Map()
  );

  // Hot deal countdown state
  const [hotDealCountdown, setHotDealCountdown] = useState<null | {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>(null);
  const [activeHotDealEnd, setActiveHotDealEnd] = useState<string | null>(null);
  const [activeHotDeal, setActiveHotDeal] = useState<any>(null);

  // Track the current hot deal for the selected product
  useEffect(() => {
    if (!selectedProduct || !featuredAndDealsData?.hot_deals) {
      setActiveHotDeal(null);
      setActiveHotDealEnd(null);
      setHotDealCountdown(null);
      return;
    }
    const deal = featuredAndDealsData.hot_deals.find(
      (d: any) => d.product_id === selectedProduct.id
    );
    if (deal && deal.deal_end_at) {
      setActiveHotDeal(deal);
      setActiveHotDealEnd(deal.deal_end_at);
      setHotDealCountdown(getTimeLeft(deal.deal_end_at));
    } else {
      setActiveHotDeal(null);
      setActiveHotDealEnd(null);
      setHotDealCountdown(null);
    }
  }, [selectedProduct, featuredAndDealsData]);

  // Countdown timer effect
  useEffect(() => {
    if (!activeHotDealEnd) return;
    const timer = setInterval(() => {
      setHotDealCountdown(getTimeLeft(activeHotDealEnd));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeHotDealEnd]);

  const isAdmin = user?.role === "super_admin";

  // Image handling functions
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - imagePreviews.length);

    newImages.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [
            ...prev,
            { file, url: reader.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleImageSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    if (specifications.length < 10) {
      setSpecifications((prev) => [...prev, { key: "", value: "" }]);
    }
  };

  const removeSpecification = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSpecification = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    setSpecifications((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      category: "",
      old_price: 0,
      new_price: 0,
      description: "",
      status: "active",
    });
    setImagePreviews([]);
    setSpecifications([{ key: "", value: "" }]);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsAddDialogOpen(open);
  };

  const handleViewDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedProduct(null);
    }
    setIsViewDialogOpen(open);
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedProduct(null);
      resetForm();
    }
    setIsEditDialogOpen(open);
  };

  // Get subscription plan and limits
  const currentPlan =
    (user?.subscription?.plan_name?.toLowerCase() as keyof typeof FEATURED_SLOTS) ||
    "basic";
  // Product limit per subscription plan
  const productLimit = PRODUCT_LIMITS[currentPlan] || 0;
  const canAddProduct =
    isAdmin ||
    (user?.subscription?.plan_name !== "basic" &&
      currentPlan !== "basic" &&
      products.length < productLimit);

  // Featured/Hot Deal slot usage (from featuredAndDealsData)
  const featuredSlotsUsed =
    featuredAndDealsData?.featured_products?.length || 0;
  const hotDealSlotsUsed = featuredAndDealsData?.hot_deals?.length || 0;
  const featuredSlotsMax = FEATURED_SLOTS[currentPlan];
  const hotDealSlotsMax = HOT_DEAL_SLOTS[currentPlan];
  const featuredSlotsAvailable = featuredSlotsMax - featuredSlotsUsed;
  const hotDealSlotsAvailable = hotDealSlotsMax - hotDealSlotsUsed;

  // Disable logic for toggles
  const disableFeatureToggle =
    featuredSlotsMax === 0 ||
    (!isFeatured && featuredSlotsUsed >= featuredSlotsMax);
  const disableHotDealToggle =
    hotDealSlotsMax === 0 ||
    (!isHotDeal && hotDealSlotsUsed >= hotDealSlotsMax);

  // Fetch promotion status from backend
  const fetchPromotions = async () => {
    if (isAdmin) return; // Admins don't see promotions
    try {
      const response = await api.get("/api/promotions");
      const promoMap = new Map<number, any>();

      // Map featured products
      if (response.data.featured_products) {
        response.data.featured_products.forEach((promo: any) => {
          promoMap.set(promo.product_id, {
            id: promo.id,
            type: "featured",
            is_active: promo.is_active,
            expired: promo.expired,
            days_left: promo.days_left,
            finish_time: promo.finish_time,
          });
        });
      }

      // Map hot deals (override if product has both)
      if (response.data.hot_deals) {
        response.data.hot_deals.forEach((deal: any) => {
          const existing = promoMap.get(deal.product_id) || {};
          promoMap.set(deal.product_id, {
            ...existing,
            id: deal.id,
            type: "hot_deal",
            deal_is_active: deal.is_active,
            deal_expired: deal.expired,
            deal_days_left: deal.days_left,
            deal_end_at: deal.deal_end_at,
          });
        });
      }

      setPromotionStatus(promoMap);
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Admin fetches from /api/admin/products, sellers from /api/my-products
        const endpoint = isAdmin ? "/api/admin/products" : "/api/my-products";
        const response = await api.get<PaginatedResponse>(endpoint);

        console.log("Products API Response:", response.data);

        // Handle both paginated and direct array responses
        const productsData = response.data.data || response.data;
        const productsList = Array.isArray(productsData) ? productsData : [];

        console.log("Products List:", productsList);

        setProducts(productsList);

        // Fetch promotions for sellers
        if (!isAdmin) {
          await fetchPromotions();
        }

        // Fetch featured and deals data for sellers (legacy)
        if (!isAdmin) {
          try {
            const dealsResponse = await api.get("/api/featured-and-deals");
            setFeaturedAndDealsData(dealsResponse.data);

            // Build maps for quick lookup
            const featuredMap = new Map<number, boolean>();
            const hotDealMap = new Map<number, boolean>();

            dealsResponse.data.featured_products?.forEach((item: any) => {
              featuredMap.set(item.product_id, true);
            });

            dealsResponse.data.hot_deals?.forEach((item: any) => {
              hotDealMap.set(item.product_id, true);
            });

            setProductFeaturedMap(featuredMap);
            setProductHotDealMap(hotDealMap);
          } catch (err) {
            console.error("Error fetching featured and deals:", err);
          }
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Prepare specifications object
      const specs: Record<string, string> = {};
      specifications.forEach((spec) => {
        if (spec.key && spec.value) {
          specs[spec.key] = spec.value;
        }
      });

      // Create FormData to handle file uploads
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("category", newProduct.category);
      formData.append("description", newProduct.description);
      formData.append("old_price", String(newProduct.old_price || 0));
      formData.append("new_price", String(newProduct.new_price || 0));
      formData.append("status", newProduct.status);
      if (Object.keys(specs).length > 0) {
        formData.append("specifications", JSON.stringify(specs));
      }

      // Append image files
      imagePreviews.forEach((preview) => {
        if (preview.file) {
          formData.append("images[]", preview.file);
        }
      });

      await api.post("/api/my-products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product added successfully!");
      handleDialogClose(false);

      // Refresh products
      const endpoint = isAdmin ? "/api/admin/products" : "/api/my-products";
      const response = await api.get<PaginatedResponse>(endpoint);
      setProducts(response.data.data || []);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to add product";
      toast.error(message);
      console.error("Product creation error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/my-products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      description: product.description,
      old_price: product.old_price || 0,
      new_price: product.new_price || 0,
      status: product.status,
    });

    // Set current images and specs for editing
    if (product.images && product.images.length > 0) {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const imagePreviews = product.images.map((img: any) => {
        const imagePath = img.path || img.image_path;
        // Construct full URL
        const fullUrl = imagePath.startsWith("http")
          ? imagePath
          : `${baseUrl}${imagePath}`;
        return {
          file: null,
          url: fullUrl,
          preview: fullUrl,
          isExisting: true,
          id: img.id,
        };
      });
      setImagePreviews(imagePreviews);
    }

    if (product.specifications && typeof product.specifications === "object") {
      const specs = Array.isArray(product.specifications)
        ? product.specifications
        : Object.entries(product.specifications).map(([key, value]) => ({
            key,
            value: String(value),
          }));
      setSpecifications(specs);
    } else {
      setSpecifications([{ key: "", value: "" }]);
    }

    // Check if product is already featured
    const isFeaturedAlready = productFeaturedMap.get(product.id) || false;
    setIsFeatured(isFeaturedAlready);

    // Check if product already has a hot deal
    const hasHotDealAlready = productHotDealMap.get(product.id) || false;
    setIsHotDeal(hasHotDealAlready);

    // Reset hot deal form
    setHotDealForm({
      deal_price: "",
      deal_start_at: "",
      deal_end_at: "",
      deal_description: "",
    });

    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (productId: number) => {
    if (!newProduct.name || !newProduct.category || !newProduct.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("category", newProduct.category);
      formData.append("description", newProduct.description);
      formData.append("old_price", String(newProduct.old_price || 0));
      formData.append("new_price", String(newProduct.new_price || 0));
      formData.append("status", newProduct.status);
      formData.append("_method", "PATCH"); // Laravel spoofing for PATCH method

      // Handle specifications
      const specsToSend = specifications.filter((s) => s.key && s.value);
      if (specsToSend.length > 0) {
        formData.append("specifications", JSON.stringify(specsToSend));
      }

      // Handle new images (those with file property)
      imagePreviews.forEach((preview, index) => {
        if (preview.file) {
          formData.append(`images[]`, preview.file);
        }
      });

      // Handle removed images (those that were existing but are no longer in the list)
      const currentImageIds = imagePreviews
        .filter((p) => p.isExisting && p.id)
        .map((p) => p.id);

      if (currentImageIds.length > 0) {
        formData.append("keep_images", JSON.stringify(currentImageIds));
      }

      const response = await api.post(
        `/api/my-products/${productId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle feature/unfeature
      if (isFeatured) {
        try {
          await api.post(`/api/products/${productId}/feature`);
          toast.success("Product featured successfully!");
        } catch (err: any) {
          const msg =
            err.response?.data?.message || "Failed to feature product";
          toast.error(msg);
        }
      }

      // Handle hot deal
      if (isHotDeal) {
        if (
          !hotDealForm.deal_price ||
          !hotDealForm.deal_start_at ||
          !hotDealForm.deal_end_at
        ) {
          toast.error("Please fill in all hot deal fields");
          return;
        }
        try {
          await api.post("/api/hot-deals", {
            product_id: productId,
            deal_price: parseFloat(hotDealForm.deal_price),
            deal_start_at: hotDealForm.deal_start_at,
            deal_end_at: hotDealForm.deal_end_at,
            deal_description: hotDealForm.deal_description || null,
          });
          toast.success("Hot deal created successfully!");
        } catch (err: any) {
          const msg =
            err.response?.data?.message || "Failed to create hot deal";
          toast.error(msg);
        }
      }

      toast.success("Product updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      setNewProduct({
        name: "",
        category: "",
        description: "",
        old_price: 0,
        new_price: 0,
        status: "active",
      });
      setImagePreviews([]);
      setSpecifications([]);
      // Keep toggles as-is, don't reset them
      setHotDealForm({
        deal_price: "",
        deal_start_at: "",
        deal_end_at: "",
        deal_description: "",
      });

      // Refresh products list
      const endpoint = isAdmin ? "/api/admin/products" : "/api/my-products";
      const fetchResponse = await api.get<PaginatedResponse>(endpoint);
      setProducts(fetchResponse.data.data || []);

      // Refresh featured and deals data for sellers
      if (!isAdmin) {
        try {
          const dealsResponse = await api.get("/api/featured-and-deals");
          setFeaturedAndDealsData(dealsResponse.data);

          const featuredMap = new Map<number, boolean>();
          const hotDealMap = new Map<number, boolean>();

          dealsResponse.data.featured_products?.forEach((item: any) => {
            featuredMap.set(item.product_id, true);
          });

          dealsResponse.data.hot_deals?.forEach((item: any) => {
            hotDealMap.set(item.product_id, true);
          });

          setProductFeaturedMap(featuredMap);
          setProductHotDealMap(hotDealMap);
        } catch (err) {
          // console.error("Error refreshing featured and deals:", err);
        }
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update product";
      toast.error(message);
      // console.error("Product update error:", error);
    }
  };

  // Feature a product
  const handleFeatureProduct = async (productId: number) => {
    // Check if already featured
    if (productFeaturedMap.get(productId)) {
      toast.error("This product is already featured");
      return;
    }

    // Check slot limits
    if (featuredSlotsUsed >= featuredSlotsMax) {
      toast.error(
        `Your ${currentPlan} plan allows only ${featuredSlotsMax} featured products. You've reached your limit.`
      );
      return;
    }

    try {
      await api.post(`/api/products/${productId}/feature`);
      toast.success("Product featured successfully!");
      // Refresh promotions
      await fetchPromotions();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to feature product";
      toast.error(msg);
    }
  };

  // Unfeature a product
  const handleUnfeatureProduct = async (productId: number) => {
    try {
      await api.delete(`/api/products/${productId}/unfeature`);
      toast.success("Product unfeatured successfully!");
      // Refresh promotions
      await fetchPromotions();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to unfeature product";
      toast.error(msg);
    }
  };

  // End hot deal early
  const handleEndHotDeal = async (productId: number) => {
    try {
      const promo = promotionStatus.get(productId);
      if (!promo || !promo.id) {
        toast.error("This product does not have an active hot deal");
        return;
      }

      if (!productHotDealMap.get(productId)) {
        toast.error("This product does not have an active hot deal");
        return;
      }

      await api.delete(`/api/hot-deals/${promo.id}`);
      toast.success("Hot deal ended successfully!");
      // Refresh promotions
      await fetchPromotions();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to end hot deal";
      toast.error(msg);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const categoryName =
      typeof product.category === "string"
        ? product.category
        : (product.category as any)?.name || "";
    const matchesCategory =
      categoryFilter === "all" || categoryName === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  // Debug: Log products for troubleshooting
  // console.log("Current products state:", products);
  // console.log("Filtered products:", filteredProducts);
  // console.log("isAdmin:", isAdmin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Manage all products across stores"
              : "Manage your store products"}
          </p>
        </div>
        {!isAdmin && (
          <Button
            variant="secondary"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={!canAddProduct}
            title={
              !canAddProduct
                ? "Upgrade your plan to add products"
                : "Add a new product"
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Store Owner Product Limit */}
      {!isAdmin && (
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Product Limit (
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan)
            </span>
            <span className="text-sm font-medium">
              {products.length} / {productLimit} products
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange to-orange-light rounded-full transition-all"
              style={{ width: `${(products.length / productLimit) * 100}%` }}
            />
          </div>
          {products.length >= productLimit && (
            <p className="text-xs text-warning mt-2">
              You've reached your product limit. Upgrade your plan to add more
              products.
            </p>
          )}
          {currentPlan === "basic" && (
            <p className="text-xs text-warning mt-2 font-medium">
              ⚠️ Basic plan does not allow adding products. Upgrade to Silver,
              Gold, or Platinum plan to start selling.
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products View */}
      {viewMode === "table" ? (
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                {isAdmin && <TableHead>Store</TableHead>}
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                {!isAdmin && <TableHead>Promotion</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  // Safety check: ensure product has required fields
                  if (!product || !product.id) {
                    // console.warn("Invalid product:", product);
                    return null;
                  }
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">
                            {product.name || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {typeof product.category === "string"
                          ? product.category
                          : (product.category as any)?.name || "Uncategorized"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>{product.store || "N/A"}</TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.old_price &&
                            parseFloat(String(product.old_price)) > 0 && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₦
                                {parseFloat(String(product.old_price)).toFixed(
                                  2
                                )}
                              </span>
                            )}
                          <span className="font-medium text-sm">
                            ₦
                            {parseFloat(String(product.new_price || 0)).toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "active"
                              ? "approved"
                              : product.status === "draft"
                              ? "pending"
                              : "muted"
                          }
                        >
                          {product.status || "unknown"}
                        </Badge>
                      </TableCell>
                      {!isAdmin && (
                        <TableCell>
                          {(() => {
                            const promo = promotionStatus.get(product.id);
                            if (!promo)
                              return (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              );

                            if (promo.type === "featured") {
                              if (promo.expired) {
                                return (
                                  <Badge variant="muted" className="text-xs">
                                    Featured (Expired)
                                  </Badge>
                                );
                              }
                              return (
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant="approved"
                                    className="text-xs w-fit"
                                  >
                                    Featured
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {promo.days_left} day
                                    {promo.days_left !== 1 ? "s" : ""} left
                                  </span>
                                </div>
                              );
                            }

                            if (promo.type === "hot_deal") {
                              if (promo.deal_expired) {
                                return (
                                  <Badge variant="muted" className="text-xs">
                                    Deal (Expired)
                                  </Badge>
                                );
                              }
                              return (
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant="destructive"
                                    className="text-xs w-fit"
                                  >
                                    Hot Deal
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {promo.deal_days_left} day
                                    {promo.deal_days_left !== 1 ? "s" : ""} left
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            );
                          })()}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleView(product)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(() => {
                              const promo = promotionStatus.get(product.id);
                              const isFeatured =
                                !!promo &&
                                promo.type === "featured" &&
                                !promo.expired;

                              if (isFeatured) {
                                return (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUnfeatureProduct(product.id)
                                    }
                                    className="text-warning"
                                  >
                                    <Star className="h-4 w-4 mr-2" />
                                    Unfeature Product
                                  </DropdownMenuItem>
                                );
                              }

                              // Check if can feature
                              const canFeature =
                                featuredSlotsMax > 0 &&
                                featuredSlotsUsed < featuredSlotsMax;

                              return (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleFeatureProduct(product.id)
                                  }
                                  disabled={!canFeature}
                                  title={
                                    !canFeature
                                      ? `Slot limit reached (${featuredSlotsUsed}/${featuredSlotsMax})`
                                      : ""
                                  }
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Feature Product
                                </DropdownMenuItem>
                              );
                            })()}

                            {(() => {
                              const promo = promotionStatus.get(product.id);
                              const hasHotDeal =
                                !!promo &&
                                promo.type === "hot_deal" &&
                                !promo.deal_expired;

                              if (hasHotDeal) {
                                return (
                                  <DropdownMenuItem
                                    onClick={() => handleEndHotDeal(product.id)}
                                    className="text-warning"
                                  >
                                    <Flame className="h-4 w-4 mr-2" />
                                    End Hot Deal
                                  </DropdownMenuItem>
                                );
                              }

                              // Check if can create hot deal
                              const canCreateHotDeal =
                                hotDealSlotsMax > 0 &&
                                hotDealSlotsUsed < hotDealSlotsMax;

                              return (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!canCreateHotDeal) {
                                      toast.error(
                                        `Your ${currentPlan} plan allows only ${hotDealSlotsMax} hot deals. You've reached your limit.`
                                      );
                                      return;
                                    }
                                    handleEdit(product);
                                    setIsHotDeal(true);
                                  }}
                                  disabled={!canCreateHotDeal}
                                  title={
                                    !canCreateHotDeal
                                      ? `Slot limit reached (${hotDealSlotsUsed}/${hotDealSlotsMax})`
                                      : ""
                                  }
                                >
                                  <Flame className="h-4 w-4 mr-2" />
                                  Create Hot Deal
                                </DropdownMenuItem>
                              );
                            })()}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 7} className="text-center">
                    <p className="text-muted-foreground py-4">
                      No products found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="p-4">
                  <h4 className="font-medium truncate">{product.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.category}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    {product.old_price &&
                      parseFloat(String(product.old_price)) > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₦{parseFloat(String(product.old_price)).toFixed(2)}
                        </span>
                      )}
                    <span className="font-semibold text-orange">
                      ₦{parseFloat(String(product.new_price || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        product.status === "active"
                          ? "approved"
                          : product.status === "draft"
                          ? "pending"
                          : "muted"
                      }
                    >
                      {product.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(product)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Image Upload */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Product Images (up to 5)
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Upload a file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or drag and drop PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 border border-border rounded-lg overflow-hidden group"
                    >
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {imagePreviews.length}/5 images uploaded
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(v) =>
                    setNewProduct({ ...newProduct, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="old_price">Old Price</Label>
                <Input
                  id="old_price"
                  type="number"
                  step="0.01"
                  value={newProduct.old_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      old_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="new_price">New Price *</Label>
                <Input
                  id="new_price"
                  type="number"
                  step="0.01"
                  value={newProduct.new_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      new_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            {/* Variations/Specifications */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Product Specifications</h4>
                <span className="text-xs text-muted-foreground">
                  {specifications.length}/10 variations
                </span>
              </div>
              <div className="space-y-3">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      placeholder="Option Name (e.g., Manufacturer)"
                      value={spec.key}
                      onChange={(e) =>
                        updateSpecification(index, "key", e.target.value)
                      }
                      className="flex-shrink-0 w-1/3"
                    />
                    <Input
                      placeholder="Values (e.g., shell)"
                      value={spec.value}
                      onChange={(e) =>
                        updateSpecification(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {specifications.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpecification}
                  className="mt-3 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Spec
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleAddProduct}>
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Featured Product Expiry (if product is featured) */}
              {featuredAndDealsData?.featured_products &&
                Array.isArray(featuredAndDealsData.featured_products) &&
                (() => {
                  const featured = featuredAndDealsData.featured_products.find(
                    (f: any) => f.product_id === selectedProduct.id
                  );
                  if (featured) {
                    const plan = (featured.plan_type ||
                      currentPlan) as keyof typeof FEATURED_DURATION_DAYS;
                    const expiry = getFeaturedExpiry(
                      featured.featured_at,
                      plan,
                      featured.finish_time
                    );
                    const now = new Date();
                    let timeLeft = null;
                    if (expiry && expiry > now) {
                      const diff = expiry.getTime() - now.getTime();
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                      const minutes = Math.floor((diff / (1000 * 60)) % 60);
                      const seconds = Math.floor((diff / 1000) % 60);
                      timeLeft = { days, hours, minutes, seconds };
                    }
                    return (
                      <div className="bg-orange/10 border border-orange/30 rounded-lg p-4 flex items-center gap-4 mb-2">
                        <Star className="h-6 w-6 text-orange" />
                        <div>
                          <div className="font-semibold text-orange">
                            Featured Product
                          </div>
                          {expiry ? (
                            <>
                              <div className="text-sm font-medium">
                                {timeLeft ? (
                                  <>
                                    Expires in:{" "}
                                    {timeLeft.days > 0 && `${timeLeft.days}d `}
                                    {timeLeft.hours}h {timeLeft.minutes}m{" "}
                                    {timeLeft.seconds}s
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Expired
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Expires at: {expiry.toLocaleString()}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No expiry info
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              {activeHotDeal && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-4 mb-2">
                  <Flame className="h-6 w-6 text-destructive" />
                  <div>
                    <div className="font-semibold text-destructive">
                      Hot Deal Active!
                    </div>
                    {hotDealCountdown ? (
                      <div className="text-sm font-medium">
                        Time left:{" "}
                        {hotDealCountdown.days > 0 &&
                          `${hotDealCountdown.days}d `}
                        {hotDealCountdown.hours}h {hotDealCountdown.minutes}m{" "}
                        {hotDealCountdown.seconds}s
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Deal ended
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Ends at:{" "}
                      {new Date(activeHotDeal.deal_end_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {/* Product Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-3">Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedProduct.images.map((image: any) => {
                      const baseUrl =
                        import.meta.env.VITE_API_BASE_URL ||
                        "http://localhost:8000";
                      const imagePath = image.path || image.image_path;
                      // Construct full URL
                      const fullUrl = imagePath.startsWith("http")
                        ? imagePath
                        : `${baseUrl}${imagePath}`;
                      return (
                        <div
                          key={image.id}
                          className="relative rounded-lg overflow-hidden bg-muted aspect-square flex items-center justify-center border border-border"
                        >
                          <img
                            src={fullUrl}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                          {image.is_primary && (
                            <div className="absolute top-2 left-2 z-10">
                              <Badge variant="secondary">Primary</Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No images available
                  </p>
                </div>
              )}

              {/* Product Info */}
              <div>
                <h4 className="text-sm font-medium mb-3">Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        selectedProduct.status === "active"
                          ? "approved"
                          : selectedProduct.status === "draft"
                          ? "pending"
                          : "muted"
                      }
                    >
                      {selectedProduct.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-medium mb-3">Pricing</h4>
                <div className="flex items-center gap-4">
                  {selectedProduct.old_price &&
                    parseFloat(String(selectedProduct.old_price)) > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Old Price
                        </p>
                        <p className="text-lg line-through text-muted-foreground">
                          ₦
                          {parseFloat(
                            String(selectedProduct.old_price)
                          ).toFixed(2)}
                        </p>
                      </div>
                    )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Current Price
                    </p>
                    <p className="text-2xl font-bold text-orange">
                      ₦
                      {parseFloat(
                        String(selectedProduct.new_price || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                  {selectedProduct.old_price &&
                    parseFloat(String(selectedProduct.old_price)) > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Discount
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {(
                            ((parseFloat(String(selectedProduct.old_price)) -
                              parseFloat(String(selectedProduct.new_price!))) /
                              parseFloat(String(selectedProduct.old_price))) *
                            100
                          ).toFixed(0)}
                          % OFF
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Specifications */}
              {selectedProduct.specifications && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Specifications</h4>
                  <div className="space-y-2">
                    {typeof selectedProduct.specifications === "object" &&
                    !Array.isArray(selectedProduct.specifications) ? (
                      Object.entries(selectedProduct.specifications).length >
                      0 ? (
                        Object.entries(selectedProduct.specifications).map(
                          ([key, value], index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm border-b border-border/50 pb-2"
                            >
                              <span className="text-muted-foreground">
                                {key}
                              </span>
                              <span className="font-medium">
                                {String(value)}
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No specifications
                        </p>
                      )
                    ) : Array.isArray(selectedProduct.specifications) ? (
                      selectedProduct.specifications.length > 0 ? (
                        selectedProduct.specifications.map(
                          (spec: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm border-b border-border/50 pb-2"
                            >
                              <span className="text-muted-foreground">
                                {spec.key}
                              </span>
                              <span className="font-medium">{spec.value}</span>
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No specifications
                        </p>
                      )
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                setSelectedProduct(null);
              }}
            >
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEdit(selectedProduct!);
              }}
            >
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Image Upload */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Product Images (up to 5)
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Upload a file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or drag and drop PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 border border-border rounded-lg overflow-hidden group bg-muted flex items-center justify-center flex-shrink-0"
                    >
                      {preview.isExisting ? (
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.alt = "Image not found";
                          }}
                        />
                      ) : (
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {imagePreviews.length}/5 images
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(v) =>
                    setNewProduct({ ...newProduct, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-old-price">Old Price</Label>
                <Input
                  id="edit-old-price"
                  type="number"
                  step="0.01"
                  value={newProduct.old_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      old_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-new-price">New Price *</Label>
                <Input
                  id="edit-new-price"
                  type="number"
                  step="0.01"
                  value={newProduct.new_price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      new_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={newProduct.status}
                onValueChange={(v) =>
                  setNewProduct({
                    ...newProduct,
                    status: v as "draft" | "active" | "suspended",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            {/* Feature & Hot Deals Section (Sellers only) */}
            {!isAdmin && (
              <>
                {/* Feature Product Toggle */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center justify-between p-3 bg-orange/5 rounded-lg border border-orange/20">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-orange" />
                      <div>
                        <h4 className="text-sm font-medium">Feature Product</h4>
                        <p className="text-xs text-muted-foreground">
                          Showcase this product on the homepage
                        </p>
                        {disableFeatureToggle && (
                          <span className="text-xs text-warning font-medium block mt-1">
                            {featuredSlotsMax === 0
                              ? "Your plan does not allow featured products."
                              : `All featured slots used (${featuredSlotsUsed}/${featuredSlotsMax}).`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        !disableFeatureToggle && setIsFeatured(!isFeatured)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isFeatured ? "bg-orange" : "bg-muted"
                      } ${
                        disableFeatureToggle
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={disableFeatureToggle}
                      title={
                        disableFeatureToggle
                          ? featuredSlotsMax === 0
                            ? "Your plan does not allow featured products."
                            : "No featured slots available."
                          : "Toggle feature product"
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isFeatured ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Hot Deal Toggle */}
                <div className="border-t border-border pt-5">
                  <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20 mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-destructive" />
                      <div>
                        <h4 className="text-sm font-medium">Create Hot Deal</h4>
                        <p className="text-xs text-muted-foreground">
                          Limited time offer for this product
                        </p>
                        {disableHotDealToggle && (
                          <span className="text-xs text-warning font-medium block mt-1">
                            {hotDealSlotsMax === 0
                              ? "Your plan does not allow hot deals."
                              : `All hot deal slots used (${hotDealSlotsUsed}/${hotDealSlotsMax}).`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        !disableHotDealToggle && setIsHotDeal(!isHotDeal)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isHotDeal ? "bg-destructive" : "bg-muted"
                      } ${
                        disableHotDealToggle
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={disableHotDealToggle}
                      title={
                        disableHotDealToggle
                          ? hotDealSlotsMax === 0
                            ? "Your plan does not allow hot deals."
                            : "No hot deal slots available."
                          : "Toggle hot deal"
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isHotDeal ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {isHotDeal && (
                    <div className="space-y-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                      <div>
                        <Label htmlFor="deal-price">Deal Price *</Label>
                        <Input
                          id="deal-price"
                          type="number"
                          step="0.01"
                          placeholder="Enter deal price"
                          value={hotDealForm.deal_price}
                          onChange={(e) =>
                            setHotDealForm({
                              ...hotDealForm,
                              deal_price: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="deal-start">
                            Start Date & Time *
                          </Label>
                          <Input
                            id="deal-start"
                            type="datetime-local"
                            value={hotDealForm.deal_start_at}
                            onChange={(e) =>
                              setHotDealForm({
                                ...hotDealForm,
                                deal_start_at: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="deal-end">End Date & Time *</Label>
                          <Input
                            id="deal-end"
                            type="datetime-local"
                            value={hotDealForm.deal_end_at}
                            onChange={(e) =>
                              setHotDealForm({
                                ...hotDealForm,
                                deal_end_at: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="deal-desc">
                          Description (Optional)
                        </Label>
                        <Input
                          id="deal-desc"
                          placeholder="e.g., Limited stock, Free shipping"
                          value={hotDealForm.deal_description}
                          onChange={(e) =>
                            setHotDealForm({
                              ...hotDealForm,
                              deal_description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Variations/Specifications */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Product Specifications</h4>
                <span className="text-xs text-muted-foreground">
                  {specifications.length}/10
                </span>
              </div>
              <div className="space-y-3">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g. Material"
                      value={spec.key}
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[index].key = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="e.g. Stainless Steel"
                      value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[index].value = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSpecifications(
                          specifications.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {specifications.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSpecification}
                  className="mt-3 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Spec
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
                setNewProduct({
                  name: "",
                  category: "",
                  description: "",
                  old_price: 0,
                  new_price: 0,
                  status: "active",
                });
                setImagePreviews([]);
                setSpecifications([]);
                setIsFeatured(false);
                setIsHotDeal(false);
                setHotDealForm({
                  deal_price: "",
                  deal_start_at: "",
                  deal_end_at: "",
                  deal_description: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleUpdateProduct(selectedProduct?.id || 0)}
            >
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
