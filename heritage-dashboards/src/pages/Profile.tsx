import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export default function Profile() {
  const { user, fetchUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<
    string | null
  >(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      if (user.profile_image_path) {
        setProfileImageUrl(user.profile_image_path);
      }
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!profileData.name || !profileData.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      setIsLoadingProfile(true);
      await api.put("/api/profile", {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      // console.error("Profile update error:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoadingPassword(true);
      await api.post("/api/change-password", {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to change password";
      toast.error(message);
      // console.error("Password change error:", error);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageFile(file);
      setSelectedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async () => {
    if (!selectedImageFile) return;
    await uploadProfileImage(selectedImageFile);
  };

  const handleCancelImageSelection = () => {
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadProfileImage = async (file: File) => {
    try {
      setIsLoadingImage(true);
      const formData = new FormData();
      formData.append("profile_image", file);

      const response = await api.post("/api/profile/upload-image", formData);

      setProfileImageUrl(response.data.profile_image_path);
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Profile image updated successfully!");

      // Refresh user data to persist the changes
      await fetchUser();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to upload profile image";
      toast.error(message);
      // console.error("Image upload error:", error);
    } finally {
      setIsLoadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar className="h-32 w-32">
                  {selectedImagePreview && (
                    <AvatarImage
                      src={selectedImagePreview}
                      alt={profileData.name}
                    />
                  )}
                  {profileImageUrl && !selectedImagePreview && (
                    <AvatarImage src={profileImageUrl} alt={profileData.name} />
                  )}
                  <AvatarFallback className="text-3xl bg-orange/10 text-orange">
                    {profileData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingImage}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-orange text-white flex items-center justify-center shadow-lg hover:bg-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <h3 className="font-heading font-semibold text-lg mt-4">
                {profileData.name}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role?.replace("_", " ")}
              </p>

              {/* Save/Cancel buttons for image */}
              {selectedImageFile && (
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSaveImage}
                    disabled={isLoadingImage}
                  >
                    {isLoadingImage ? "Saving..." : "Save Image"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelImageSelection}
                    disabled={isLoadingImage}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
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
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={handleUpdateProfile}
                disabled={isLoadingProfile}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoadingProfile ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Password must be at least 8 characters
              </p>
              <Button
                variant="secondary"
                onClick={handleChangePassword}
                disabled={isLoadingPassword}
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLoadingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
