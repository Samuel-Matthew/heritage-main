import { Helmet } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useSiteSettings } from "./hooks/useSiteSettings";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Stores from "./pages/Stores";
import StoreProfile from "./pages/StoreProfile";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SellerRegister from "./pages/seller/SellerRegister";
import RegistrationSuccess from "./pages/seller/RegistrationSuccess";
import HotDeals from "./pages/HotDeals";
import Wholesale from "./pages/Featured";
import About from "./pages/About";
import SellerGuide from "./pages/SellerGuide";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import HelpCenter from "./pages/HelpCenter";

const queryClient = new QueryClient();

const App = () => {
  const { settings } = useSiteSettings();

  return (
    <QueryClientProvider client={queryClient}>
      <Helmet>
        <title>{settings?.site_title || "Heritage Energy"}</title>
        <meta name="description" content={settings?.meta_description || ""} />
        <meta name="keywords" content={settings?.meta_keywords || ""} />
        {settings?.favicon && (
          <link
            rel="icon"
            href={`http://localhost:8000/storage/${settings.favicon}`}
          />
        )}
      </Helmet>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/store/:id" element={<StoreProfile />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/seller/register" element={<SellerRegister />} />
              <Route
                path="/seller/registration-success"
                element={<RegistrationSuccess />}
              />
              <Route path="/seller/login" element={<Login isSeller />} />
              <Route path="/deals" element={<HotDeals />} />
              <Route path="/featured" element={<Wholesale />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/help/seller" element={<SellerGuide />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
