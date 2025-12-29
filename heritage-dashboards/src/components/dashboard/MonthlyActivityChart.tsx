import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "@/lib/api";
import { toast } from "sonner";

export function MonthlyActivityChart() {
  const [data, setData] = useState<
    Array<{ month: string; stores: number; products: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyActivity();
  }, []);

  const fetchMonthlyActivity = async () => {
    try {
      setIsLoading(true);
      const [storesRes, productsRes] = await Promise.all([
        api.get("/api/admin/stores?per_page=10000"),
        api.get("/api/admin/products?per_page=10000"),
      ]);

      const stores = storesRes.data.data || [];
      const products = productsRes.data.data || [];

      // Group stores and products by month
      const monthlyData = new Map<
        string,
        { stores: number; products: number }
      >();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      stores.forEach((store: any) => {
        const dateStr = store.createdAt || store.created_at;
        if (dateStr) {
          const date = new Date(dateStr);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { stores: 0, products: 0 });
          }
          const curr = monthlyData.get(monthKey)!;
          curr.stores += 1;
        }
      });

      products.forEach((product: any) => {
        const dateStr = product.createdAt || product.created_at;
        if (dateStr) {
          const date = new Date(dateStr);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { stores: 0, products: 0 });
          }
          const curr = monthlyData.get(monthKey)!;
          curr.products += 1;
        }
      });

      // Convert to array and sort by date
      const chartData = Array.from(monthlyData.entries())
        .map(([month, { stores, products }]) => ({ month, stores, products }))
        .sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        )
        .slice(-6); // Last 6 months

      setData(chartData);
    } catch (error) {
      toast.error("Failed to load monthly activity");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-fade-in flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading monthly activity...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-fade-in flex items-center justify-center h-96">
        <div className="text-muted-foreground">No activity data available</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-6">
        Monthly Activity
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "var(--shadow-md)",
              }}
            />
            <Line
              type="monotone"
              dataKey="stores"
              stroke="hsl(20 43% 21%)"
              strokeWidth={3}
              dot={{ fill: "hsl(20 43% 21%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(28 80% 52%)" }}
            />
            <Line
              type="monotone"
              dataKey="products"
              stroke="hsl(28 80% 52%)"
              strokeWidth={3}
              dot={{ fill: "hsl(28 80% 52%)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(20 43% 21%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chocolate" />
          <span className="text-sm text-muted-foreground">New Stores</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange" />
          <span className="text-sm text-muted-foreground">New Products</span>
        </div>
      </div>
    </div>
  );
}
