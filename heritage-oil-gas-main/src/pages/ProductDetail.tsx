import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard, Product } from "@/components/products/ProductCard";
import {
  MessageCircle,
  Phone,
  MapPin,
  Truck,
  Shield,
  RefreshCw,
  Share2,
  Store,
  ChevronRight,
  Loader,
} from "lucide-react";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

// Mock product data
const mockProduct: Product & {
  description: string;
  specifications: { label: string; value: string }[];
  images: string[];
  // seller contact info included on store for chat/call actions
  store: { name: string; id: string; phone?: string };
} = {
  id: "1",
  name: "Shell Helix Ultra 5W-40 Fully Synthetic Motor Oil - 4L",
  image:
    "https://images.unsplash.com/photo-1635784063388-1ff609731d7d?w=800&h=800&fit=crop",
  images: [
    "https://images.unsplash.com/photo-1635784063388-1ff609731d7d?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=800&fit=crop",
  ],
  category: "Automotive Lubricants",
  store: { name: "PetroChem Supplies", id: "1", phone: "+2348012345678" },
  inStock: true,
  description: `Shell Helix Ultra is Shell's most advanced motor oil, designed to work like no other for high-performance engines. Its unique ActiveCleansing technology helps to keep your engine running like new.

Features:
• Active Cleansing Technology removes dirt and sludge
• Enhanced protection against wear
• Designed for high-performance engines
• Excellent low temperature fluidity
• Fuel economy benefits

Suitable for: Modern gasoline and diesel engines where the manufacturer recommends API SN/CF or ACEA A3/B3, A3/B4.`,
  specifications: [
    { label: "Viscosity Grade", value: "5W-40" },
    { label: "Volume", value: "4 Liters" },
    { label: "Base Oil Type", value: "Fully Synthetic" },
    { label: "API Rating", value: "SN/CF" },
    { label: "ACEA Rating", value: "A3/B3, A3/B4" },
    { label: "Manufacturer", value: "Shell" },
    { label: "Country of Origin", value: "Netherlands" },
    { label: "Warranty", value: "Original Product Guarantee" },
  ],
};

const relatedProducts: Product[] = [
  {
    id: "2",
    name: "Mobil 1 ESP 5W-30 Advanced Synthetic Engine Oil - 5L",
    image:
      "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=400&h=400&fit=crop",
    category: "Automotive Lubricants",
    store: { name: "Lagos Oil Depot", id: "2", phone: "+2347016309167" },
    inStock: true,
  },
  {
    id: "3",
    name: "Total Quartz 9000 Energy 5W-40 - 4L Pack",
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop",
    category: "Automotive Lubricants",
    store: { name: "AutoLube Nigeria", id: "3", phone: "+2347016309167" },
    inStock: true,
  },
  {
    id: "8",
    name: "Castrol Edge 0W-40 A3/B4 - 4L",
    image:
      "https://images.unsplash.com/photo-1635784063388-1ff609731d7d?w=400&h=400&fit=crop",
    category: "Automotive Lubricants",
    store: { name: "PetroChem Supplies", id: "1", phone: "+2347016309167" },
    inStock: true,
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [relatedProds, setRelatedProds] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the specific product
        const response = await api.get(`/api/products/${id}`);
        const productData = response.data.data || response.data;

        // Transform API data
        const transformedProduct = {
          id: productData.id?.toString(),
          name: productData.name,
          category: productData.category?.name || "Uncategorized",
          description: productData.description || "No description available",
          price: productData.new_price || 0,
          wholesalePrice: productData.old_price,
          image: getImageUrl(
            productData.images?.[0]?.image_path || productData.images?.[0]?.path
          ),
          images: productData.images?.map((img: any) =>
            getImageUrl(img.image_path || img.path)
          ) || [
            getImageUrl(
              productData.images?.[0]?.image_path ||
                productData.images?.[0]?.path
            ),
          ],
          store: {
            name: productData.store?.name || "N/A",
            id: productData.store?.id?.toString() || "0",
            phone: productData.store?.phone || undefined,
          },
          inStock: productData.status === "active",
          specifications: Array.isArray(productData.specifications)
            ? productData.specifications
            : [],
        };

        setProduct(transformedProduct);

        // Fetch related products (same category)
        const relatedResponse = await api.get(
          `/api/products?category=${productData.category?.id || ""}`
        );
        const relatedData = relatedResponse.data.data || relatedResponse.data;
        const relatedList = Array.isArray(relatedData)
          ? relatedData
          : [relatedData];

        const transformed = relatedList
          .filter((p: any) => p.id?.toString() !== id)
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id?.toString(),
            name: p.name,
            category: p.category?.name || "Uncategorized",
            image: getImageUrl(
              p.images?.[0]?.image_path || p.images?.[0]?.path
            ),
            store: {
              name: p.store?.name || "N/A",
              id: p.store?.id?.toString() || "0",
              phone: p.store?.phone,
            },
            inStock: p.status === "active",
          }));

        setRelatedProds(transformed);
      } catch (err) {
        // console.error("Error fetching product:", err);
        setError("Failed to load product details");
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="container py-12">
          <Card className="p-8 text-center">
            <p className="text-destructive mb-4">
              {error || "Product not found"}
            </p>
            <Button asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // prepare whatsapp link for chat action (strip non-digits)
  const sellerPhoneDigits = product.store?.phone
    ? product.store.phone.replace(/\D/g, "")
    : "";
  const waHref = sellerPhoneDigits
    ? `https://wa.me/${sellerPhoneDigits}?text=${encodeURIComponent(
        `Hi, I'm interested in ${product.name}`
      )}`
    : "#";

  // Handle share functionality
  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this product: ${product.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      } catch (err) {
        // console.error("Error copying to clipboard:", err);
        toast.error("Failed to share product");
      }
    }
  };

  return (
    <MainLayout>
      <div className="bg-muted/50 border-b">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-primary">
              Products
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              to={`/products?category=${product.category
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
              className="hover:text-primary"
            >
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant="accent" className="mb-2">
                  {product.category}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-heading font-bold">
                  {product.name}
                </h1>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare()}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Stock */}
            <div className="mb-6">
              {product.inStock ? (
                <Badge variant="success">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Price removed - contact seller to negotiate */}
            {/* <div className="p-4 rounded-xl bg-accent/50 mb-6">
              <p className="text-sm text-muted-foreground">Price removed from listing — contact the seller to negotiate.</p>
            </div> */}

            {/* Quantity removed — negotiation/contact seller for order quantities */}

            {/* Actions: Chat opens WhatsApp to seller; Call shows phone modal */}
            <div className="flex gap-3 mb-6">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="lg" variant="secondary" className="w-full">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat Seller
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowPhoneModal(true)}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call
              </Button>
            </div>

            {/* Store Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop"
                      alt={product.store.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <Link
                      to={`/store/${product.store.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {product.store.name}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      Lagos, Nigeria
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to={`/store/${product.store.id}`}>
                      <Store className="w-4 h-4 mr-2" />
                      View Store
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Phone modal */}
            {showPhoneModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowPhoneModal(false)}
                />
                <div className="relative w-full max-w-md p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Seller</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Seller phone number:
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-medium">
                          {product.store?.phone || "Not provided"}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" asChild>
                            <a href={`tel:${product.store?.phone || ""}`}>
                              Call
                            </a>
                          </Button>
                          <Button
                            onClick={() => {
                              if (product.store?.phone && navigator.clipboard) {
                                navigator.clipboard.writeText(
                                  product.store.phone
                                );
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: "Fast Delivery" },
                { icon: Shield, label: "Verified Seller" },
                { icon: RefreshCw, label: "Easy Returns" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50"
                >
                  <feature.icon className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-line">{product.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {product.specifications &&
                Array.isArray(product.specifications) &&
                product.specifications.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {product.specifications.map((spec: any, i: number) => {
                      // Handle both {key, value} and {name, value} formats
                      const specKey = spec.key || spec.name || spec.label || "";
                      const specValue = spec.value || "";

                      // Skip empty specs
                      if (!specKey || !specValue) return null;

                      return (
                        <div
                          key={i}
                          className="flex justify-between py-2 border-b last:border-0"
                        >
                          <span className="text-muted-foreground font-medium">
                            {specKey}
                          </span>
                          <span className="font-medium text-foreground">
                            {specValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No specifications available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Reviews removed — reviews not shown on listing */}
        </Tabs>

        {/* Related Products */}
        <div>
          <h2 className="text-xl font-heading font-bold mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProds.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
