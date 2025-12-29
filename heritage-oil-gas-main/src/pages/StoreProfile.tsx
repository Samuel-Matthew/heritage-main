import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard, Product } from "@/components/products/ProductCard";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Package,
  Clock,
  ChevronRight,
} from "lucide-react";
import api, { getImageUrl } from "@/lib/api";
import { toast } from "sonner";

const StoreProfile = () => {
  const { id } = useParams();
  const [storeData, setStoreData] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch store and its products on mount
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch store products using the store ID
        const productsResponse = await api.get(`/api/stores/${id}/products`);

        console.log("API Response:", productsResponse.data);

        // Handle both paginated and non-paginated responses
        const productsData =
          productsResponse.data.data || productsResponse.data;
        const productsList = Array.isArray(productsData)
          ? productsData
          : productsData && typeof productsData === "object"
          ? [productsData]
          : [];

        console.log("Products List:", productsList);

        if (!productsList || productsList.length === 0) {
          setError("No products found for this store");
          setIsLoading(false);
          return;
        }

        // Get store data from the first product
        const firstProduct = productsList[0];
        console.log("First Product:", firstProduct);

        if (!firstProduct.store) {
          console.error("Store not found in product:", firstProduct);
          setError("Store information not found");
          setIsLoading(false);
          return;
        }

        const storeInfo = firstProduct.store;
        let logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          storeInfo.name
        )}&background=4F46E5&color=fff&bold=true`;

        // Try to get logo from documents if available
        if (storeInfo.company_logo) {
          logo = getImageUrl(storeInfo.company_logo);
        }

        console.log(
          "Store Logo:",
          logo,
          "From company_logo:",
          storeInfo.company_logo
        );

        setStoreData({
          id: storeInfo.id?.toString(),
          name: storeInfo.name || "N/A",
          logo: logo,
          banner:
            "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&h=400&fit=crop",
          description: storeInfo.description || "Premium oil & gas supplier",
          location: storeInfo.state ? `${storeInfo.state}, Nigeria` : "Nigeria",
          address: storeInfo.address || "N/A",
          phone: storeInfo.phone || "N/A",
          email: storeInfo.email || "N/A",
          rating: storeInfo.rating || 4.5,
          reviews: storeInfo.reviews_count || 0,
          productCount: storeInfo.products_count || productsList.length,
          joinedDate: storeInfo.created_at
            ? new Date(storeInfo.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })
            : "N/A",
          verified: storeInfo.status === "approved",
          responseTime: "Usually responds within 2 hours",
        });

        // Transform products
        const products = productsList.map((product: any) => ({
          id: product.id?.toString(),
          name: product.name,
          category: product.category?.name || "Uncategorized",
          description: product.description,
          price: product.new_price || 0,
          wholesalePrice: product.old_price,
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

        setStoreProducts(products);
      } catch (error: any) {
        console.error("Error fetching store data:", error);
        setError(
          error?.response?.status === 404
            ? "Store not found"
            : "Failed to load store information"
        );
        toast.error("Failed to load store information");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStoreData();
    }
  }, [id]);

  return (
    <MainLayout>
      {isLoading ? (
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Loading store information...</p>
        </div>
      ) : error || !storeData ? (
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">{error || "Store not found"}</p>
        </div>
      ) : (
        <>
          {/* Banner */}
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary to-secondary">
            {storeData.banner && (
              <img
                src={storeData.banner}
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          </div>

          <div className="container relative">
            {/* Store Info Card */}
            <Card className="-mt-20 relative z-10 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Logo */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-4 border-card shadow-lg bg-card flex-shrink-0">
                    <img
                      src={storeData.logo}
                      alt={storeData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-2xl font-heading font-bold">
                            {storeData.name}
                          </h1>
                          {storeData.verified && (
                            <Badge variant="success">Verified</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{storeData.location}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const phoneNumber = storeData.phone.replace(
                              /\D/g,
                              ""
                            );
                            const whatsappUrl = `https://wa.me/${phoneNumber}`;
                            window.open(whatsappUrl, "_blank");
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            window.location.href = `tel:${storeData.phone}`;
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentUrl = window.location.href;
                            if (navigator.share) {
                              navigator.share({
                                title: storeData.name,
                                text: `Check out ${storeData.name} on Heritage marketplace`,
                                url: currentUrl,
                              });
                            } else {
                              navigator.clipboard.writeText(currentUrl);
                              toast.success("Link copied to clipboard");
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-4 text-muted-foreground">
                      {storeData.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="products" className="mb-8">
              <TabsList>
                <TabsTrigger value="products">
                  Products ({storeData.productCount})
                </TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {storeProducts.length > 0 ? (
                    storeProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full text-center py-8">
                      No products available
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Address
                          </p>
                          <p className="font-medium">{storeData.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{storeData.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{storeData.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Store Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Response Time
                          </p>
                          <p className="font-medium">
                            {storeData.responseTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Products
                          </p>
                          <p className="font-medium">
                            {storeData.productCount} products listed
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Member Since
                        </p>
                        <p className="font-medium">{storeData.joinedDate}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default StoreProfile;
