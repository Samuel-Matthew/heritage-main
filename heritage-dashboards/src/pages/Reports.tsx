import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Store,
  Package,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/api";
import { toast } from "sonner";

const storesByPlan = [
  { name: "Silver", value: 45, color: "#94a3b8" },
  { name: "Gold", value: 38, color: "#f59e0b" },
  { name: "Platinum", value: 22, color: "#a855f7" },
];

const productsByCategory = [
  { category: "Automotive", products: 120 },
  { category: "Industrial", products: 85 },
  { category: "Greases", products: 45 },
  { category: "Fuel", products: 62 },
  { category: "Machinery", products: 98 },
  { category: "Safety", products: 55 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("6months");
  const [kpiData, setKpiData] = useState({
    activeStores: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [storesData, setStoresData] = useState(storesByPlan);
  const [productsData, setProductsData] = useState(productsByCategory);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);

      // Fetch stores count
      const storesRes = await api.get("/api/admin/stores?per_page=1");
      const activeStores = storesRes.data.pagination?.total || 0;

      // Fetch products count
      const productsRes = await api.get("/api/admin/products?per_page=1");
      const totalProducts = productsRes.data.pagination?.total || 0;

      // Fetch users count
      const usersRes = await api.get("/api/admin/users?per_page=1");
      const totalUsers = usersRes.data.pagination?.total || 0;

      setKpiData({
        activeStores,
        totalProducts,
        totalUsers,
      });

      // Fetch categories for products by category chart
      const categoriesRes = await api.get("/api/admin/categories?per_page=100");
      const categoriesData =
        categoriesRes.data.data?.map((cat: any) => ({
          category: cat.name,
          products: cat.products_count,
        })) || productsByCategory;
      setProductsData(categoriesData);

      // Fetch stores by subscription plan for pie chart
      const planRes = await api.get(
        "/api/admin/subscriptions/analytics/by-plan"
      );
      const planData = planRes.data.data || storesByPlan;
      setStoresData(planData);

      // console.log("Report data loaded:", {
      //   activeStores,
      //   totalProducts,
      //   totalUsers,
      //   dateRange,
      // });
    } catch (error: any) {
      // console.error("Failed to fetch report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRangeParams = (range: string) => {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case "7days":
        startDate.setDate(today.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(today.getDate() - 30);
        break;
      case "3months":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(today.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    return {
      start_date: startDate.toISOString().split("T")[0],
      end_date: today.toISOString().split("T")[0],
    };
  };

  const exportCSV = () => {
    try {
      const headers = ["Metric", "Value"];
      const rows = [
        ["Active Stores", kpiData.activeStores.toString()],
        ["Total Products", kpiData.totalProducts.toString()],
        ["Total Users", kpiData.totalUsers.toString()],
      ];

      // Add stores by plan
      rows.push(["", ""]);
      rows.push(["Stores by Plan", ""]);
      storesData.forEach((store: any) => {
        rows.push([store.name, store.value.toString()]);
      });

      // Add products by category
      rows.push(["", ""]);
      rows.push(["Products by Category", ""]);
      productsData.forEach((product: any) => {
        rows.push([product.category, product.products.toString()]);
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heritage-reports-${dateRange}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("CSV report exported successfully");
    } catch (error) {
      // console.error("Failed to export CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const exportPDF = () => {
    try {
      const reportData = {
        title: "Heritage Oil & Gas - Reports & Analytics",
        dateRange,
        generatedDate: new Date().toLocaleDateString(),
        kpiData,
        storesData,
        productsData,
      };

      const pdfContent = `
        Heritage Oil & Gas - Reports & Analytics
        Generated: ${reportData.generatedDate}
        Date Range: ${dateRange}
        
        ============================================
        KEY PERFORMANCE INDICATORS
        ============================================
        
        Active Stores: ${reportData.kpiData.activeStores}
        Total Products: ${reportData.kpiData.totalProducts}
        Total Users: ${reportData.kpiData.totalUsers}
        
        ============================================
        STORES BY SUBSCRIPTION PLAN
        ============================================
        ${reportData.storesData
          .map((s: any) => `${s.name}: ${s.value} stores`)
          .join("\n")}
        
        ============================================
        PRODUCTS BY CATEGORY
        ============================================
        ${reportData.productsData
          .map((p: any) => `${p.category}: ${p.products} products`)
          .join("\n")}
      `;

      const blob = new Blob([pdfContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heritage-reports-${dateRange}-${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report exported successfully");
    } catch (error) {
      // console.error("Failed to export report:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform performance and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="secondary" onClick={exportPDF} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          icon={Store}
          label="Active Stores"
          value={kpiData.activeStores.toString()}
        />
        <KPICard
          icon={Package}
          label="Total Products"
          value={kpiData.totalProducts.toString()}
        />
        <KPICard
          icon={Users}
          label="Total Users"
          value={kpiData.totalUsers.toString()}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stores by Plan */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <h3 className="font-heading font-semibold text-lg mb-4">
            Stores by Subscription Plan
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {storesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Products by Category */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <h3 className="font-heading font-semibold text-lg mb-4">
            Products by Category
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e5e5",
                  }}
                />
                <Bar dataKey="products" fill="#4B2E1E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  change,
  positive,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  change?: number;
  positive?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-orange" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-chocolate">{value}</p>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm ${
              positive ? "text-success" : "text-destructive"
            }`}
          >
            {positive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
