import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import api from "@/lib/api";
import { toast } from "sonner";

export function StoresByStateChart() {
  const [data, setData] = useState<Array<{ state: string; stores: number }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStoresByState();
  }, []);

  const fetchStoresByState = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/admin/stores?per_page=1000");
      const stores = res.data.data || [];

      // Group stores by state
      const stateMap = new Map<string, number>();
      stores.forEach((store: any) => {
        const state = store.state || "Unknown";
        stateMap.set(state, (stateMap.get(state) || 0) + 1);
      });

      // Convert to array and sort by count descending
      const chartData = Array.from(stateMap.entries())
        .map(([state, count]) => ({ state, stores: count }))
        .sort((a, b) => b.stores - a.stores)
        .slice(0, 6); // Top 6 states

      setData(chartData);
    } catch (error) {
      console.error("Failed to fetch stores by state:", error);
      toast.error("Failed to load stores data");
      // Set default data on error
      setData([
        { state: "Lagos", stores: 0 },
        { state: "Rivers", stores: 0 },
        { state: "Abuja", stores: 0 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-fade-in">
      <h3 className="font-heading font-semibold text-lg mb-6">
        Stores by State
      </h3>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Loading chart data...
        </div>
      ) : data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
            >
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="state"
                axisLine={false}
                tickLine={false}
                width={60}
                className="text-xs"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-md)",
                }}
                cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
              />
              <Bar dataKey="stores" radius={[0, 6, 6, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index % 2 === 0 ? "hsl(20 43% 21%)" : "hsl(28 80% 52%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
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
