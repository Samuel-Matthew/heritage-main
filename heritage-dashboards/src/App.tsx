import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RootRedirect } from "@/components/RootRedirect";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Stores from "@/pages/Stores";
import StoreVerification from "@/pages/StoreVerification";
import Subscriptions from "@/pages/Subscriptions";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Exhibitions from "@/pages/Exhibitions";
import Users from "@/pages/Users";
import Reports from "@/pages/Reports";
import AuditLogs from "@/pages/AuditLogs";
import SystemSettings from "@/pages/SystemSettings";
import MyStore from "@/pages/MyStore";
import Documents from "@/pages/Documents";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import VerificationQueue from "./pages/VerificationQueue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirect - redirects to dashboard based on role */}
            <Route path="/" element={<RootRedirect />} />

            {/* ================= ADMIN ================= */}
            <Route
              element={
                <ProtectedRoute requiredRoles={["super_admin"]}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/stores" element={<Stores />} />
              <Route
                path="/admin/stores/:id/verification"
                element={<StoreVerification />}
              />
              <Route path="/admin/subscriptions" element={<Subscriptions />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/exhibitions" element={<Exhibitions />} />
              <Route path="/admin/messages" element={<Messages />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
              <Route path="/admin/documents" element={<Documents />} />
              <Route path="/admin/verification-queue" element={<VerificationQueue />} />
            </Route>

            {/* Store Owner Routes */}
            <Route
              element={
                <ProtectedRoute requiredRoles={["store_owner"]}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/seller/dashboard" element={<Dashboard />} />
              <Route path="/seller/my-store" element={<MyStore />} />
              <Route path="/seller/subscriptions" element={<Subscriptions />} />
              <Route path="/seller/products" element={<Products />} />
              <Route path="/seller/categories" element={<Categories />} />
              <Route path="/seller/messages" element={<Messages />} />
              <Route path="/seller/documents" element={<Documents />} />
            </Route>

            {/* Shared Routes (All authenticated users) */}

            {/* ================= SHARED ================= */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Error and catch-all routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/login" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
