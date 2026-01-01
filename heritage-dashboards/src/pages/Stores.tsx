import { useState, useEffect } from "react";
import { Search, Filter, Download, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

interface Store {
  id: string;
  name: string;
  owner: string;
  email: string;
  state: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  products: number;
  subscription: string;
  createdAt: string;
  phone: string;
  address: string;
  rc_number: string;
}

export default function Stores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [states, setStates] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "suspend" | null
  >(null);
  const [reason, setReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch stores from backend
  useEffect(() => {
    fetchStores();
  }, [searchQuery, statusFilter, stateFilter]);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/admin/stores`, {
        params: {
          search: searchQuery || undefined,
          status: statusFilter,
          state: stateFilter,
          per_page: 15,
        },
      });

      console.log("Stores API Response:", response.data); // Debug log

      if (response.data.data) {
        setStores(response.data.data);
        // Extract unique states from stores
        const uniqueStates = [
          ...new Set(response.data.data.map((s: any) => s.state)),
        ] as string[];
        setStates(uniqueStates);
      } else {
        console.warn("No data found in response:", response.data);
        setStores([]);
      }
    } catch (error: any) {
      toast.error("Failed to fetch stores");
      console.error(
        "Error fetching stores:",
        error.response?.data || error.message
      );
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveStore = async () => {
    if (!selectedStore) return;
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/stores/${selectedStore.id}/approve`, {});
      toast.success("Store approved successfully");
      setActionType(null);
      setSelectedStore(null);
      fetchStores();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to approve store";
      toast.error(message);
      console.error("Approve error:", error.response?.data || error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectStore = async () => {
    if (!selectedStore || !reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/stores/${selectedStore.id}/reject`, {
        rejection_reason: reason,
      });
      toast.success("Store rejected successfully");
      setActionType(null);
      setSelectedStore(null);
      setReason("");
      fetchStores();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reject store";
      toast.error(message);
      console.error("Reject error:", error.response?.data || error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSuspendStore = async () => {
    if (!selectedStore || !reason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/stores/${selectedStore.id}/suspend`, {
        reason,
      });
      toast.success("Store suspended successfully");
      setActionType(null);
      setSelectedStore(null);
      setReason("");
      fetchStores();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to suspend store";
      toast.error(message);
      console.error("Suspend error:", error.response?.data || error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const closeDialog = () => {
    setActionType(null);
    setSelectedStore(null);
    setReason("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Stores Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered stores on the platform.
          </p>
        </div>
        <Button variant="secondary">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stores or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Store
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
                  Products
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Registered
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Loading stores...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No stores found
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr
                    key={store.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
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
                    <td className="p-4 text-foreground">{store.owner}</td>
                    <td className="p-4 text-foreground">{store.state}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          store.status === "approved"
                            ? "default"
                            : store.status === "pending"
                            ? "secondary"
                            : store.status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {store.status.charAt(0).toUpperCase() +
                          store.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-foreground">{store.products}</td>
                    <td className="p-4 text-foreground">
                      {store.subscription}
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-sm">
                      {store.createdAt}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/stores/${store.id}/verification`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {/* {store.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStore(store);
                                  setActionType("approve");
                                }}
                                className="text-green-600"
                              >
                                ✓ Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStore(store);
                                  setActionType("reject");
                                }}
                                className="text-red-600"
                              >
                                ✕ Reject
                              </DropdownMenuItem>
                            </>
                          )} */}
                          {(store.status === "approved" ||
                            store.status === "pending") && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStore(store);
                                setActionType("suspend");
                              }}
                              className="text-destructive"
                            >
                              Suspend Store
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionType !== null} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Store"
                : actionType === "reject"
                ? "Reject Store"
                : "Suspend Store"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Are you sure you want to approve "${selectedStore?.name}"?`
                : actionType === "reject"
                ? `Reject "${selectedStore?.name}" - please provide a reason`
                : `Suspend "${selectedStore?.name}" - please provide a reason`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(actionType === "reject" || actionType === "suspend") && (
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder={
                    actionType === "reject"
                      ? "Why are you rejecting this store?"
                      : "Why are you suspending this store?"
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={
                actionType === "approve"
                  ? handleApproveStore
                  : actionType === "reject"
                  ? handleRejectStore
                  : handleSuspendStore
              }
              disabled={isActionLoading}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {isActionLoading
                ? "Processing..."
                : actionType === "approve"
                ? "Approve"
                : actionType === "reject"
                ? "Reject"
                : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
