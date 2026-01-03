import { useState, useEffect } from "react";
import {
  Store,
  Camera,
  MapPin,
  Mail,
  Phone,
  Globe,
  Clock,
  Save,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

interface Document {
  id: string;
  type: string;
  file_path: string;
  status: string;
}

interface StoreData {
  id?: string;
  name: string;
  description?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city?: string;
  state: string;
  openingHours?: string;
  status?: string;
  subscription?: string;
  rc_number?: string;
  products_count?: number;
  documents?: Document[];
}

export default function MyStore() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [companyLogoPath, setCompanyLogoPath] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<StoreData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
  });

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/my-store");
      setStoreData({
        id: response.data.id,
        name: response.data.name,
        description: response.data.description || "",
        email: response.data.email,
        phone: response.data.phone,
        alternatePhone: response.data.alternatePhone || "",
        website: response.data.website || "",
        address: response.data.address,
        city: response.data.city || "",
        state: response.data.state,
        openingHours: response.data.openingHours || "",
        status: response.data.status,
        subscription: response.data.subscription,
        rc_number: response.data.rc_number,
        products_count: response.data.products_count,
        documents: response.data.documents,
      });

      // Extract company logo from documents
      const logoDoc = response.data.documents?.find(
        (doc: Document) =>
          doc.type.toLowerCase().includes("logo") ||
          doc.type.toLowerCase().includes("company")
      );
      if (logoDoc?.file_path) {
        setCompanyLogoPath(logoDoc.file_path);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to load store details";
      if (error.response?.status !== 404) {
        toast.error(message);
      }
      // console.error("Error fetching store:", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.patch(`/api/my-store`, {
        name: storeData.name,
        description: storeData.description,
        email: storeData.email,
        phone: storeData.phone,
        alternatePhone: storeData.alternatePhone,
        website: storeData.website,
        address: storeData.address,
        city: storeData.city,
        state: storeData.state,
        openingHours: storeData.openingHours,
      });
      toast.success("Store details updated successfully!");
      setIsEditing(false);

      // Re-fetch store data to ensure logo and all data are up to date from database
      await fetchStoreData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update store";
      toast.error(message);
      // console.error("Error saving store:", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post("/api/my-store/upload-logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.logo_path) {
        setCompanyLogoPath(response.data.logo_path);

        // Update the documents array to include the logo document
        setStoreData((prev) => {
          const logoPath = response.data.logo_path;

          // Check if logo document already exists
          const existingLogoIndex = prev.documents.findIndex(
            (doc: Document) =>
              doc.type.toLowerCase().includes("logo") ||
              doc.type.toLowerCase().includes("company")
          );

          let updatedDocuments;
          if (existingLogoIndex >= 0) {
            // Update existing logo document
            updatedDocuments = [...prev.documents];
            updatedDocuments[existingLogoIndex] = {
              ...updatedDocuments[existingLogoIndex],
              file_path: logoPath,
            };
          } else {
            // Add new logo document
            updatedDocuments = [
              ...prev.documents,
              {
                id: `temp_${Date.now()}`,
                type: "company_logo",
                status: "approved",
                is_mandatory: false,
                file_path: logoPath,
                created_at: new Date().toISOString().split("T")[0],
                rejection_reason: null,
              },
            ];
          }

          return {
            ...prev,
            documents: updatedDocuments,
          };
        });

        toast.success("Logo uploaded successfully!");

        // Fetch latest data from database to confirm persistence
        setTimeout(() => {
          fetchStoreData();
        }, 500);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to upload logo";
      toast.error(message);
      // console.error("Error uploading logo:", message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            My Store
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your store details and information
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Store
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading store details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Photo & Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Store Photo */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="font-heading font-semibold mb-4">Company Logo</h3>
              <div className="aspect-square rounded-xl bg-muted flex items-center justify-center relative overflow-hidden">
                {companyLogoPath ? (
                  <img
                    key={companyLogoPath}
                    src={`${
                      import.meta.env.VITE_API_BASE_URL ||
                      "http://localhost:8000"
                    }/storage/${companyLogoPath}?v=${new Date().getTime()}`}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-16 w-16 text-muted-foreground" />
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-foreground/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-center text-white">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Change Logo</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </label>
                )}
              </div>
              {isEditing && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  asChild
                  disabled={isUploadingLogo}
                >
                  <label className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </label>
                </Button>
              )}
            </div>

            {/* Store Status */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="font-heading font-semibold mb-4">Store Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verification</span>
                  <Badge
                    variant={
                      storeData.status === "approved"
                        ? "default"
                        : storeData.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {storeData.status?.charAt(0).toUpperCase() +
                      storeData.status?.slice(1) || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">RC Number</span>
                  <span className="font-mono text-sm">
                    {storeData.rc_number || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subscription</span>
                  <Badge
                    variant={
                      storeData.subscription === "platinum"
                        ? "default"
                        : storeData.subscription === "gold"
                        ? "secondary"
                        : storeData.subscription === "silver"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {storeData.subscription?.charAt(0).toUpperCase() +
                      storeData.subscription?.slice(1) || "Basic"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Products</span>
                  <span className="font-medium">
                    {storeData.products_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="font-heading font-semibold mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={storeData.name}
                    onChange={(e) =>
                      setStoreData({ ...storeData, name: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={storeData.description || ""}
                    onChange={(e) =>
                      setStoreData({
                        ...storeData,
                        description: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="font-heading font-semibold mb-4">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={storeData.email}
                      onChange={(e) =>
                        setStoreData({ ...storeData, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={storeData.phone}
                      onChange={(e) =>
                        setStoreData({ ...storeData, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="altPhone">Alternate Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="altPhone"
                      value={storeData.alternatePhone || ""}
                      onChange={(e) =>
                        setStoreData({
                          ...storeData,
                          alternatePhone: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={storeData.website || ""}
                      onChange={(e) =>
                        setStoreData({ ...storeData, website: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
              <h3 className="font-heading font-semibold mb-4">Location</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={storeData.address}
                      onChange={(e) =>
                        setStoreData({ ...storeData, address: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={storeData.city || ""}
                      onChange={(e) =>
                        setStoreData({ ...storeData, city: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={storeData.state}
                      onValueChange={(v) =>
                        setStoreData({ ...storeData, state: v })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {nigerianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="hours">Opening Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hours"
                      value={storeData.openingHours || ""}
                      onChange={(e) =>
                        setStoreData({
                          ...storeData,
                          openingHours: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="pl-10"
                      placeholder="e.g., 8:00 AM - 6:00 PM"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
