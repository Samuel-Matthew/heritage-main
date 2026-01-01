import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  CreditCard,
  Package,
  FolderTree,
  Flag,
  MessageSquare,
  Users,
  BarChart3,
  History,
  Settings,
  FileText,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Store, label: "Stores Management", path: "/admin/stores" },
  {
    icon: ShieldCheck,
    label: "Store Verification",
    path: "/admin/verification-queue",
  },
  { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  { icon: Flag, label: "Store Reports", path: "/admin/store-reports" },
  // { icon: MessageSquare, label: "RFQs & Messages", path: "/admin/messages" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: BarChart3, label: "Reports & Analytics", path: "/admin/reports" },
  // { icon: History, label: "Audit Logs", path: "/admin/audit-logs" },
  { icon: Settings, label: "System Settings", path: "/admin/settings" },
  { icon: User, label: "Profile & Settings", path: "/profile" },
];

const storeOwnerMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/seller/dashboard" },
  { icon: Store, label: "My Store", path: "/seller/my-store" },
  { icon: FileText, label: "Documents", path: "/seller/documents" },
  { icon: CreditCard, label: "Subscription", path: "/seller/subscriptions" },
  { icon: Package, label: "Products", path: "/seller/products" },
  // { icon: MessageSquare, label: "RFQs / Messages", path: "/seller/messages" },
  { icon: Settings, label: "Profile & Settings", path: "/profile" },
];

const userMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Store, label: "Browse Stores", path: "/browse-stores" },
  { icon: Package, label: "Browse Products", path: "/browse-products" },
  { icon: MessageSquare, label: "My RFQs", path: "/my-rfqs" },
  { icon: Settings, label: "Profile & Settings", path: "/profile" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const menuItems =
    user?.role === "super_admin"
      ? adminMenuItems
      : user?.role === "store_owner"
      ? storeOwnerMenuItems
      : userMenuItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-heading font-semibold text-sidebar-foreground">
              Menu
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary sidebar-active-indicator"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive && "text-sidebar-primary"
                      )}
                    />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
