import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import api from "@/lib/api";
import { toast } from "sonner";

const COLORS = [
  "hsl(20 43% 21%)",
  "hsl(28 80% 52%)",
  "hsl(35 85% 58%)",
  "hsl(20 35% 30%)",
  "hsl(30 15% 70%)",
];

export function ProductsByCategoryChart() {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProductsByCategory();
  }, []);

  const fetchProductsByCategory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/admin/categories?per_page=100");
      const categories = res.data.data || [];

      // Transform categories data to chart format
      const chartData = categories
        .map((cat: any) => ({
          name: cat.name,
          value: cat.products_count || 0,
        }))
        .filter((item: any) => item.value > 0)
        .sort((a: any, b: any) => b.value - a.value);

      setData(chartData.length > 0 ? chartData : []);
    } catch (error) {
      console.error("Failed to fetch products by category:", error);
      toast.error("Failed to load category data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-6">
        Products by Category
      </h3>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Loading chart data...
        </div>
      ) : data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
