import {
  Store,
  Package,
  CreditCard,
  Clock,
  ShoppingCart,
  FileCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StoresByStateChart } from "@/components/dashboard/StoresByStateChart";
import { ProductsByCategoryChart } from "@/components/dashboard/ProductsByCategoryChart";
import { MonthlyActivityChart } from "@/components/dashboard/MonthlyActivityChart";
import { RecentStoresTable } from "@/components/dashboard/RecentStoresTable";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "store_owner") {
    return <StoreOwnerDashboard />;
  }

  if (user?.role === "buyer") {
    return <UserDashboard />;
  }

  return <AdminDashboard />;
}

function UserDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Welcome Back!
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover stores and products in the Heriglob marketplace.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="My RFQs" value={5} icon={ShoppingCart} />
        <MetricCard title="Saved Stores" value={12} icon={Store} />
        <MetricCard title="Messages" value={8} icon={Package} />
        <MetricCard title="Account Status" value="Active" icon={FileCheck} />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Store}
            title="Browse Stores"
            description="Find verified stores"
          />
          <QuickActionCard
            icon={Package}
            title="Browse Products"
            description="Explore products"
          />
          <QuickActionCard
            icon={ShoppingCart}
            title="Submit RFQ"
            description="Request for quotation"
          />
          <QuickActionCard
            icon={FileCheck}
            title="My Profile"
            description="Update your details"
          />
        </div>
      </div>

      {/* Featured Stores */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">
          Featured Stores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: "PetroLube Nigeria",
              location: "Lagos",
              products: 15,
              tier: "Platinum",
            },
            {
              name: "Delta Energy Supplies",
              location: "Rivers",
              products: 8,
              tier: "Gold",
            },
            {
              name: "Kano Oil & Gas",
              location: "Kano",
              products: 5,
              tier: "Silver",
            },
          ].map((store) => (
            <div
              key={store.name}
              className="p-4 rounded-xl border border-border hover:border-orange/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg gradient-orange flex items-center justify-center">
                  <Store className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{store.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {store.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {store.products} products
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    store.tier === "Platinum"
                      ? "bg-purple-100 text-purple-700"
                      : store.tier === "Gold"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {store.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    pendingApprovals: 0,
    activeStores: 0,
    pendingSubscriptions: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    try {
      setIsLoading(true);

      // Fetch stores
      const storesRes = await api.get("/api/admin/stores?per_page=1000");
      const stores = storesRes.data.data || [];
      const activeStores = stores.filter(
        (s: any) => s.status === "approved"
      ).length;
      const pendingApprovals = stores.filter(
        (s: any) => s.status === "pending"
      ).length;

      // Fetch subscriptions
      const subsRes = await api.get("/api/admin/subscriptions?per_page=1000");
      const subs = subsRes.data.data || [];
      const pendingSubscriptions = subs.filter(
        (s: any) => s.status === "pending"
      ).length;

      // Fetch products
      const productsRes = await api.get("/api/admin/products?per_page=1");
      const totalProducts = productsRes.data.pagination?.total || 0;

      setMetrics({
        pendingApprovals,
        activeStores,
        pendingSubscriptions,
        totalProducts,
      });
    } catch (error) {
      // console.error("Failed to fetch admin metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your platform overview.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={Clock}
        />
        <MetricCard
          title="Active Stores"
          value={metrics.activeStores}
          icon={Store}
        />
        <MetricCard
          title="Pending Subscriptions"
          value={metrics.pendingSubscriptions}
          icon={CreditCard}
        />
        <MetricCard
          title="Total Products"
          value={metrics.totalProducts.toString()}
          icon={Package}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StoresByStateChart />
        <ProductsByCategoryChart />
      </div>

      {/* Monthly Activity */}
      <MonthlyActivityChart />

      {/* Recent Stores Table */}
      <RecentStoresTable />
    </div>
  );
}

function StoreOwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeProducts, setActiveProducts] = useState(0);
  const [productLimit, setProductLimit] = useState(0);
  const [planName, setPlanName] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [subscriptionPlanStatus, setSubscriptionPlanStatus] =
    useState("expired");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch store info first
        // console.log("Fetching store data...");
        const storeRes = await api.get("/api/my-store");
        // console.log("Store response:", storeRes.data);
        const storeData = storeRes.data;
        if (storeData) {
          // Get plan name from active subscription if available, otherwise use subscription field
          let plan = storeData.subscription || "Basic";
          if (storeData.active_subscription?.plan_display_name) {
            plan = storeData.active_subscription.plan_display_name;
            setProductLimit(storeData.active_subscription.product_limit || 0);
          }
          // Capitalize first letter
          plan = plan.charAt(0).toUpperCase() + plan.slice(1);
          // console.log("Setting plan name to:", plan);
          setPlanName(plan);

          // Determine subscription status: active if there's an active_subscription, otherwise check the field
          const hasActiveSubscription =
            storeData.active_subscription !== null &&
            storeData.active_subscription !== undefined;
          const status = hasActiveSubscription
            ? "active"
            : storeData.subscription_plan_status || "expired";
          // console.log(
          //   "Setting subscription status to:",
          //   status,
          //   "hasActiveSubscription:",
          //   hasActiveSubscription
          // );
          setSubscriptionPlanStatus(status);

          // Get verification status from store status
          setVerificationStatus(storeData.status || "pending");
        }

        // Fetch products to count active ones
        // console.log("Fetching products...");
        const productsRes = await api.get("/api/products");
        // console.log("Products response:", productsRes.data);
        const products = productsRes.data.data || [];
        const active = products.filter(
          (p: any) => p.status === "active"
        ).length;
        // console.log("Active products:", active);
        setActiveProducts(active);

        // Fetch subscription as backup to get product limit
        try {
          const subscriptionRes = await api.get("/api/subscription/current");
          // console.log("Subscription response:", subscriptionRes.data);
          const subscription = subscriptionRes.data?.data;
          if (subscription && subscription.product_limit) {
            // console.log(
            //   "Setting product limit from subscription:",
            //   subscription.product_limit
            // );
            setProductLimit(subscription.product_limit);
          }
        } catch (error) {
          // Subscription endpoint might fail, that's ok
          // console.log("Subscription fetch skipped:", error);
        }
      } catch (error) {
        // console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          My Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your store and track performance.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Products"
          value={`${activeProducts} / ${productLimit}`}
          icon={Package}
        />
        <MetricCard
          title="Plan"
          value={planName || "Loading..."}
          icon={CreditCard}
        />
        <MetricCard
          title="Subscription Status"
          value={subscriptionPlanStatus === "active" ? "Active" : "Expired"}
          icon={Clock}
          // change={subscriptionPlanStatus === "active" ? undefined : 0}
        />
        <MetricCard
          title="Verification Status"
          value={verificationStatus || "Pending"}
          icon={FileCheck}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <h3 className="font-heading font-semibold text-lg mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Package}
            title="Add Product"
            description="List a new product"
            onClick={() => navigate("/seller/products")}
          />
          <QuickActionCard
            icon={FileCheck}
            title="Upload Documents"
            description="Update your documents"
            onClick={() => navigate("/seller/documents")}
          />
          <QuickActionCard
            icon={CreditCard}
            title="Upgrade Plan"
            description="Get more product slots"
            onClick={() => navigate("/seller/subscriptions")}
          />
          <QuickActionCard
            icon={Store}
            title="Edit Store"
            description="Update store details"
            onClick={() => navigate("/seller/my-store")}
          />
        </div>
      </div>

      {/* Monthly Activity */}
      {/* <MonthlyActivityChart /> */}
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Package;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border border-border hover:border-orange/50 hover:bg-orange/5 transition-all cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center mb-3 group-hover:gradient-orange transition-all">
        <Icon className="h-5 w-5 text-orange group-hover:text-secondary-foreground" />
      </div>
      <h4 className="font-medium text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
