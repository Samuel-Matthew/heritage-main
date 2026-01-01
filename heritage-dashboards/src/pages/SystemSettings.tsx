import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Globe,
  Database,
  Save,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API_URL = "http://localhost:8000/api";

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    site_name: "",
    site_title: "",
    meta_description: "",
    meta_keywords: "",
    logo: null as string | null,
    favicon: null as string | null,
  });

  const getToken = () => {
    return localStorage.getItem("auth_token");
  };

  const getCsrfToken = () => {
    // Try to get from meta tag
    const token = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    return token || "";
  };

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch(
        `${API_URL.replace("/api", "")}/sanctum/csrf-cookie`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      console.log("CSRF cookie response:", response.status);
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
    }
  };

  // Update document title and meta description when settings load
  useEffect(() => {
    if (settings.site_name) {
      document.title = `${settings.site_name} | System Settings`;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute(
        "content",
        settings.meta_description || settings.site_name
      );
    }
  }, [settings.site_name, settings.meta_description]);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchingSettings(true);
      console.log("Fetching settings from:", `${API_URL}/settings`);

      const response = await fetch(`${API_URL}/settings`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("GET response status:", response.status);
      const text = await response.text();
      console.log("GET response text:", text.substring(0, 200));

      const data = JSON.parse(text);
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          ...data.data,
        }));
        if (data.data.logo) {
          setLogoPreview(
            `${API_URL.replace("/api", "")}/storage/${data.data.logo}`
          );
        }
        if (data.data.favicon) {
          setFaviconPreview(
            `${API_URL.replace("/api", "")}/storage/${data.data.favicon}`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setFetchingSettings(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      // Add text fields
      formData.append("site_name", settings.site_name);
      formData.append("site_title", settings.site_title);
      formData.append("meta_description", settings.meta_description);
      formData.append("meta_keywords", settings.meta_keywords);

      // Add logo if selected
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      // Add favicon if selected
      if (faviconFile) {
        formData.append("favicon", faviconFile);
      }

      const response = await fetch(`${API_URL}/settings`, {
        method: "PATCH",
        body: formData,
      });

      const text = await response.text();
      console.log("PATCH response status:", response.status);
      console.log("PATCH response text full:", text);
      console.log(
        "PATCH response text (first 500 chars):",
        text.substring(0, 500)
      );

      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response was:", text.substring(0, 1000));
        throw new Error(
          "Server returned invalid JSON: " + text.substring(0, 200)
        );
      }

      if (!response.ok) {
        console.error("API Error:", data);
        throw new Error(data.message || "Failed to save settings");
      }

      if (data.success) {
        toast.success("Settings saved successfully!");
        setLogoFile(null);
        // Refresh settings to get updates from server
        fetchSettings();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    setLogoFile(null);
    toast.info("Settings reset to saved values");
  };

  if (fetchingSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || fetchingSettings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={loading || fetchingSettings}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-orange" />
            </div>
            <h3 className="font-heading font-semibold text-lg">
              General Settings
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.site_name}
                onChange={(e) =>
                  setSettings({ ...settings, site_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="siteTitle">Site Title</Label>
              <Input
                id="siteTitle"
                type="text"
                value={settings.site_title}
                onChange={(e) =>
                  setSettings({ ...settings, site_title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={settings.meta_description}
                onChange={(e) =>
                  setSettings({ ...settings, meta_description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="metaKeywords">Meta Keywords</Label>
              <Textarea
                id="metaKeywords"
                value={settings.meta_keywords}
                onChange={(e) =>
                  setSettings({ ...settings, meta_keywords: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="flex gap-4 items-start">
                {logoPreview && (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-24 rounded-lg border border-border/50 object-cover"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-border transition">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload logo
                    </span>
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended size: 256x256px. Max 2MB.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="favicon">Favicon</Label>
              <div className="flex gap-4 items-start">
                {faviconPreview && (
                  <div className="relative">
                    <img
                      src={faviconPreview}
                      alt="Favicon preview"
                      className="h-16 w-16 rounded-lg border border-border/50 object-cover"
                    />
                    <button
                      onClick={handleRemoveFavicon}
                      className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-border transition">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload favicon
                    </span>
                    <input
                      id="favicon"
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended size: 32x32px or 64x64px. Max 1MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        {/* <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-orange" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, smsNotifications: v })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, pushNotifications: v })}
              />
            </div>
          </div>
        </div> */}

        {/* Security Settings */}
        {/* <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-orange" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(v) => setSettings({ ...settings, twoFactorAuth: v })}
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
              />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
