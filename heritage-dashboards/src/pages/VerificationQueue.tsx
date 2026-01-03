import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";

interface Store {
  id: string;
  name: string;
  owner: string;
  email: string;
  state: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  createdAt: string;
  phone: string;
  address: string;
}

export default function VerificationQueue() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingStores();
  }, []);

  const fetchPendingStores = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/admin/stores`, {
        params: {
          status: "pending",
          per_page: 50,
        },
      });

      if (response.data.data) {
        setStores(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch pending stores");
      // console.error("Error fetching stores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange" />
            Verification Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending stores in order of registration (First
            Come First Served)
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange">{stores.length}</p>
          <p className="text-sm text-muted-foreground">Pending Approvals</p>
        </div>
      </div>

      {/* Stores Queue */}
      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading pending stores...
          </div>
        ) : stores.length === 0 ? (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">All Caught Up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No pending stores waiting for verification.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    #
                  </th>
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
                    Registered
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store, index) => (
                  <tr
                    key={store.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 text-sm font-semibold text-orange w-8">
                      {index + 1}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {store.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {store.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-foreground font-medium">
                      {store.owner}
                    </td>
                    <td className="p-4 text-foreground">{store.state}</td>
                    <td className="p-4 text-muted-foreground font-mono text-sm">
                      {store.createdAt}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        className="bg-orange hover:bg-orange/90 text-white"
                        onClick={() =>
                          navigate(`/admin/stores/${store.id}/verification`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      {stores.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Stores are listed in order of registration
            (FCFS). Start from the top to maintain fairness. All submitted
            documents must be approved before a store can be officially
            approved.
          </p>
        </div>
      )}
    </div>
  );
}
