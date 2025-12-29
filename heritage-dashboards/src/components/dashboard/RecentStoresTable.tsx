import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

interface Store {
  id: string | number;
  name: string;
  owner?: string;
  email?: string;
  state: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  created_at?: string;
}

export function RecentStoresTable() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentStores();
  }, []);

  const fetchRecentStores = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/admin/stores?per_page=10000");
      const allStores = response.data.data || [];

      // Sort by created_at descending (most recent first) and take first 4
      const recentStores = allStores
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.created_at).getTime();
          const dateB = new Date(b.createdAt || b.created_at).getTime();
          return dateB - dateA;
        })
        .slice(0, 4);

      setStores(recentStores);
    } catch (error) {
      toast.error("Failed to load recent stores");
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOwnerName = (store: Store) => {
    return store.owner || "N/A";
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        return "N/A";
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl shadow-card border border-border/50 animate-fade-in overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-semibold text-lg">
            Recent Store Registrations
          </h3>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          Loading recent stores...
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-card border border-border/50 animate-fade-in overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-semibold text-lg">
            Recent Store Registrations
          </h3>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          No stores registered yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/50 animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-lg">
            Recent Store Registrations
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/stores")}
            className="text-orange hover:text-orange-dark"
          >
            View All
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Store Name
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Owner
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                State
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr
                key={store.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td className="p-4">
                  <span className="font-medium">{store.name}</span>
                </td>
                <td className="p-4 text-muted-foreground">
                  {getOwnerName(store)}
                </td>
                <td className="p-4 text-muted-foreground">{store.state}</td>
                <td className="p-4">
                  <Badge variant={store.status}>{store.status}</Badge>
                </td>
                <td className="p-4 text-muted-foreground font-mono text-sm">
                  {formatDate(store.createdAt || store.created_at || "")}
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate(`/admin/stores/${store.id}/verification`)
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
