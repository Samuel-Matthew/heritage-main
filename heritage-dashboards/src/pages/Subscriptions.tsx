import { useState, useEffect } from "react";
import {
  CreditCard,
  Check,
  X,
  Eye,
  Download,
  Search,
  Filter,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const mockSubscriptions = [
  {
    id: "1",
    store: "PetroMax Nigeria",
    owner: "John Adeyemi",
    plan: "gold",
    status: "active",
    expiresAt: "2024-03-15",
    paymentProof: "#",
  },
  {
    id: "2",
    store: "LubeKing Ltd",
    owner: "Mary Okonkwo",
    plan: "platinum",
    status: "pending",
    expiresAt: "2024-02-28",
    paymentProof: "#",
  },
  {
    id: "3",
    store: "OilMaster Co",
    owner: "David Obi",
    plan: "silver",
    status: "expired",
    expiresAt: "2024-01-20",
    paymentProof: "#",
  },
  {
    id: "4",
    store: "FuelExpress",
    owner: "Sarah Ibrahim",
    plan: "gold",
    status: "pending",
    expiresAt: "2024-03-01",
    paymentProof: "#",
  },
];

export default function Subscriptions() {
  const { user } = useAuth();

  const isAdmin = user?.role === "super_admin";

  if (!isAdmin) {
    return <StoreOwnerSubscription />;
  }

  return <AdminSubscriptions />;
}

function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<
    string | null
  >(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingSubscriptionId, setRejectingSubscriptionId] = useState<
    number | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectingSubmit, setIsRejectingSubmit] = useState(false);

  // Fetch subscription plans from API
  const fetchSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await api.get("/api/admin/subscription-plans");
      setSubscriptionPlans(response.data.data || response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch subscription plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setPlansLoading(false);
    }
  };

  // Fetch plans on component mount
  useEffect(() => {
    fetchSubscriptionPlans();
    fetchSubscriptions();
  }, []);

  const localSubscriptionPlans = [
    {
      id: "basic",
      name: "Basic Store",
      products: 0,
      price: 0,
      color: "bg-gray-400",
    },
    {
      id: "silver",
      name: "Silver Store",
      products: 5,
      price: 5000,
      color: "bg-slate-400",
    },
    {
      id: "gold",
      name: "Gold Store",
      products: 10,
      price: 7500,
      color: "bg-amber-400",
    },
    {
      id: "platinum",
      name: "Platinum Store",
      products: 20,
      price: 12000,
      color: "bg-purple-400",
    },
  ];

  useEffect(() => {
    fetchSubscriptions();
  }, [searchQuery, statusFilter, planFilter]);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/admin/subscriptions", {
        params: {
          status: statusFilter,
          plan: planFilter,
          search: searchQuery,
        },
      });
      setSubscriptions(response.data.data || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load subscriptions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (subscriptionId: number) => {
    try {
      await api.patch(`/api/admin/subscriptions/${subscriptionId}/approve`);
      toast.success("Subscription approved successfully!");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to approve subscription"
      );
    }
  };

  const handleReject = (subscriptionId: number) => {
    setRejectingSubscriptionId(subscriptionId);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleSubmitRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setIsRejectingSubmit(true);
      await api.patch(
        `/api/admin/subscriptions/${rejectingSubscriptionId}/reject`,
        {
          rejection_reason: rejectionReason,
        }
      );
      toast.success("Subscription rejected successfully");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setRejectingSubscriptionId(null);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to reject subscription"
      );
    } finally {
      setIsRejectingSubmit(false);
    }
  };

  const handleViewReceipt = async (subscriptionId: number) => {
    try {
      const response = await api.get(
        `/api/admin/subscriptions/${subscriptionId}/payment-receipt`
      );
      setReceiptData(response.data);
      setSelectedPaymentReceipt(`receipt-${subscriptionId}`);
    } catch (error: any) {
      toast.error("Failed to load payment receipt");
    }
  };

  const handleEditPlan = async (plan: any) => {
    try {
      // Fetch full plan details from database
      const response = await api.get(
        `/api/admin/subscription-plans/${plan.id}`
      );
      const fullPlan = response.data;

      setEditingPlan(fullPlan);
      setEditFormData({
        name: fullPlan.name || "",
        price: fullPlan.price || 0,
        product_limit: fullPlan.product_limit || 0,
        bank_account_name: fullPlan.bank_account_name || "",
        bank_account_number: fullPlan.bank_account_number || "",
        bank_name: fullPlan.bank_name || "",
      });
      setIsEditPlanDialogOpen(true);
    } catch (error: any) {
      toast.error("Failed to load plan details");
    }
  };

  const handleSavePlanEdits = async () => {
    if (!editingPlan || !editFormData) return;

    try {
      setIsSavingPlan(true);
      const response = await api.patch(
        `/api/admin/subscription-plans/${editingPlan.id}`,
        {
          name: editFormData.name,
          price: parseFloat(editFormData.price) || 0,
          product_limit: parseInt(editFormData.product_limit) || 0,
          bank_account_name: editFormData.bank_account_name || null,
          bank_account_number: editFormData.bank_account_number || null,
          bank_name: editFormData.bank_name || null,
        }
      );

      if (response.data) {
        toast.success("Plan updated successfully!");
        setIsEditPlanDialogOpen(false);
        setEditingPlan(null);
        setEditFormData(null);
        // Refresh plans to reflect the changes
        await fetchSubscriptionPlans();
      }
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast.error(error.response?.data?.message || "Failed to update plan");
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Subscriptions
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage store subscription plans and payments
        </p>
      </div>

      {/* Subscription Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plansLoading ? (
          <div className="col-span-4 text-center py-8">
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        ) : subscriptionPlans.length > 0 ? (
          subscriptionPlans.map((plan) => {
            // Map plan slug to colors for display
            const colorMap: { [key: string]: string } = {
              basic: "bg-gray-400",
              silver: "bg-slate-400",
              gold: "bg-amber-400",
              platinum: "bg-purple-400",
            };
            const planColor = colorMap[plan.slug] || "bg-gray-400";

            return (
              <div
                key={plan.id}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${planColor} flex items-center justify-center`}
                  >
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.product_limit === 0
                        ? "No products"
                        : `${plan.product_limit} products/month`}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-chocolate mb-4">
                  {plan.price === 0
                    ? "Free"
                    : `₦${parseInt(plan.price).toLocaleString()}`}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.price > 0 ? "/month" : ""}
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleEditPlan(plan)}
                >
                  Edit Plan
                </Button>
              </div>
            );
          })
        ) : (
          <div className="col-span-4 text-center py-8">
            <p className="text-muted-foreground">No subscription plans found</p>
          </div>
        )}
      </div>

      {/* Filters */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No subscriptions found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Store</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.store_name}
                  </TableCell>
                  <TableCell>{sub.owner_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {sub.plan_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sub.status === "active"
                          ? "approved"
                          : sub.status === "pending"
                          ? "pending"
                          : "rejected"
                      }
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sub.created_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {sub.payment_receipt_path && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewReceipt(sub.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {sub.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-success hover:text-success"
                            onClick={() => handleApprove(sub.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleReject(sub.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Payment Receipt Dialog */}
      <Dialog
        open={!!selectedPaymentReceipt}
        onOpenChange={() => {
          setSelectedPaymentReceipt(null);
          setReceiptData(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptData?.payment_receipt_url ? (
            <div>
              <img
                src={receiptData.payment_receipt_url}
                alt="Payment Receipt"
                className="w-full rounded-lg"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPaymentReceipt(null)}
                >
                  Close
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Payment receipt not found</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog
        open={isEditPlanDialogOpen}
        onOpenChange={setIsEditPlanDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingPlan?.name}</DialogTitle>
          </DialogHeader>

          {editFormData && (
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Plan Name
                </label>
                <Input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      name: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Price Field */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Price (₦)
                </label>
                <Input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Product Limit Field */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Product Limit
                </label>
                <Input
                  type="number"
                  value={editFormData.product_limit}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      product_limit: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Bank Account Name */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Bank Account Name
                </label>
                <Input
                  type="text"
                  value={editFormData.bank_account_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      bank_account_name: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Bank Account Number */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Bank Account Number
                </label>
                <Input
                  type="text"
                  value={editFormData.bank_account_number}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      bank_account_number: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Bank Name
                </label>
                <Input
                  type="text"
                  value={editFormData.bank_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      bank_name: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditPlanDialogOpen(false)}
                  disabled={isSavingPlan}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSavePlanEdits}
                  disabled={isSavingPlan}
                >
                  {isSavingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Modal */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this subscription..."
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent resize-none"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This reason will be sent to the store owner
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isRejectingSubmit}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmitRejection}
                disabled={isRejectingSubmit || !rejectionReason.trim()}
              >
                {isRejectingSubmit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Subscription"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StoreOwnerSubscription() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [productsCount, setProductsCount] = useState(0);

  // Fetch subscription plans from API
  const fetchSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await api.get("/api/admin/subscription-plans");
      setSubscriptionPlans(response.data.data || response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch subscription plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setPlansLoading(false);
    }
  };

  // Fetch current subscription status
  const fetchCurrentSubscription = async () => {
    try {
      setIsLoadingSubscription(true);
      const response = await api.get("/api/subscription/current");
      setCurrentSubscription(response.data.data || response.data || null);
    } catch (error: any) {
      console.error("Failed to fetch subscription:", error);
      setCurrentSubscription(null);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Fetch products count
  const fetchProductsCount = async () => {
    try {
      const response = await api.get("/api/products");
      const products = response.data.data || [];
      setProductsCount(products.length);
    } catch (error: any) {
      console.error("Failed to fetch products count:", error);
    }
  };

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchCurrentSubscription();
    fetchProductsCount();
  }, []);

  // Poll for subscription updates when status is pending (check every 5 seconds)
  useEffect(() => {
    if (currentSubscription?.status === "pending") {
      const interval = setInterval(() => {
        fetchCurrentSubscription();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentSubscription?.status]);

  // Get current plan based on actual approved or pending subscription
  // If active, approved or pending, use the subscribed plan; if expired, show basic; otherwise use basic plan
  let currentPlan;
  if (
    (currentSubscription?.status === "active" ||
      currentSubscription?.status === "approved" ||
      currentSubscription?.status === "pending") &&
    subscriptionPlans.length > 0
  ) {
    const foundPlan = subscriptionPlans.find(
      (p) => String(p.id) === String(currentSubscription.plan_id)
    );
    currentPlan =
      foundPlan ||
      subscriptionPlans.find((p) => p.slug === "basic") ||
      subscriptionPlans[0];
  } else {
    currentPlan =
      subscriptionPlans.find((p) => p.slug === "basic") || subscriptionPlans[0];
  }

  const handleUpgrade = (planId: string | number) => {
    // Check if store is approved before allowing subscription upgrade
    if (user?.verification_status !== "approved") {
      toast.error(
        "Your store must be approved before purchasing a subscription plan"
      );
      return;
    }
    setUpgradingPlanId(String(planId));
    setIsUpgradeDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentFile(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentFile || !upgradingPlanId) {
      toast.error("Please select a payment receipt");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("plan_id", upgradingPlanId);
      formData.append("payment_receipt", paymentFile);

      const response = await api.post("/api/subscription/upgrade", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedPlan(upgradingPlanId);
      setIsUpgradeDialogOpen(false);
      setPaymentFile(null);

      // Refresh subscription data
      await fetchSubscriptionPlans();
      await fetchCurrentSubscription();

      toast.success("Payment submitted! Awaiting admin confirmation");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const upgradingPlan = subscriptionPlans.find(
    (p) => String(p.id) === upgradingPlanId
  );
  const displayPlan = currentPlan;
  const displayStatus = currentSubscription?.status || "none";

  // Debug log to check current subscription
  console.log("Current Subscription:", currentSubscription);
  console.log("Subscription Plans:", subscriptionPlans);
  console.log("Display Plan:", displayPlan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          My Subscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your store subscription plan
        </p>
      </div>

      {/* Approval Status Warning */}
      {user?.verification_status !== "approved" && (
        <div className="bg-orange/10 border border-orange/30 rounded-lg p-4 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-orange text-sm font-bold">!</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Store Approval Required
            </h3>
            <p className="text-sm text-muted-foreground">
              Your store must be approved by an admin before you can purchase
              subscription plans. Current status:{" "}
              <span className="font-medium text-orange">
                {user?.verification_status || "pending"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {plansLoading ? (
        <div className="bg-card rounded-2xl p-12 shadow-card text-center">
          <p className="text-muted-foreground">
            Loading your subscription plans...
          </p>
        </div>
      ) : !displayPlan ? (
        <div className="bg-card rounded-2xl p-12 shadow-card text-center">
          <p className="text-muted-foreground">
            No subscription plans available. Please contact support.
          </p>
        </div>
      ) : (
        <>
          {/* Current Plan Card */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${
                    {
                      basic: "bg-gray-400",
                      silver: "bg-slate-400",
                      gold: "bg-amber-400",
                      platinum: "bg-purple-400",
                    }[displayPlan?.slug] || "bg-gray-400"
                  } flex items-center justify-center`}
                >
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">
                    {displayPlan?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentSubscription?.status === "pending"
                      ? "Payment Pending"
                      : currentSubscription?.status === "active" &&
                        displayPlan?.slug !== "basic"
                      ? "Active Subscription"
                      : currentSubscription?.status === "approved"
                      ? "Active Subscription"
                      : currentSubscription?.status === "expired"
                      ? "Subscription Expired"
                      : "No Active Subscription"}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  currentSubscription?.status === "approved"
                    ? "approved"
                    : currentSubscription?.status === "pending"
                    ? "pending"
                    : currentSubscription?.status === "expired"
                    ? "destructive"
                    : "default"
                }
              >
                {currentSubscription?.status || "none"}
              </Badge>
            </div>

            {/* Usage Progress - Only show if not basic plan */}
            {displayPlan?.product_limit > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Products Used</span>
                  <span className="font-medium">
                    {productsCount} / {displayPlan.product_limit}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange to-orange-light rounded-full transition-all"
                    style={{
                      width: `${
                        (productsCount / displayPlan.product_limit) * 100
                      }%`,
                    }}
                  />
                </div>
                {productsCount >= displayPlan.product_limit && (
                  <p className="text-xs text-warning mt-2">
                    You've reached your product limit. Upgrade your plan to add
                    more products.
                  </p>
                )}
              </div>
            )}

            {displayPlan.product_limit === 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  ⓘ Basic plan does not allow listing products. Upgrade to a
                  paid plan to start selling.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              {displayStatus === "pending" && (
                <p className="text-sm text-amber-600">
                  ✓ Payment submitted and awaiting admin confirmation
                </p>
              )}
              {displayStatus === "active" && displayPlan?.slug !== "basic" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Subscription active from{" "}
                    {currentSubscription?.starts_at
                      ? new Date(
                          currentSubscription.starts_at
                        ).toLocaleDateString()
                      : ""}{" "}
                    until{" "}
                    {currentSubscription?.ends_at
                      ? new Date(
                          currentSubscription.ends_at
                        ).toLocaleDateString()
                      : "renewal"}
                  </p>
                </div>
              )}
              {displayStatus === "expired" && (
                <p className="text-sm text-red-600">
                  Your subscription expired on{" "}
                  {currentSubscription?.ends_at
                    ? new Date(currentSubscription.ends_at).toLocaleDateString()
                    : ""}
                  . You have been reverted to the basic plan.
                </p>
              )}
              {displayStatus === "none" && displayPlan?.slug === "basic" && (
                <p className="text-sm text-muted-foreground">
                  Active subscription
                </p>
              )}
            </div>
          </div>

          {/* Plans Cards */}
          <div>
            <h3 className="font-heading font-semibold mb-4">
              Subscription Plans
            </h3>
            {plansLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Loading subscription plans...
                </p>
              </div>
            ) : subscriptionPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subscriptionPlans.map((plan) => {
                  // Map plan slug to colors for display
                  const colorMap: { [key: string]: string } = {
                    basic: "bg-gray-400",
                    silver: "bg-slate-400",
                    gold: "bg-amber-400",
                    platinum: "bg-purple-400",
                  };
                  const planColor = colorMap[plan.slug] || "bg-gray-400";

                  return (
                    <div
                      key={plan.id}
                      className={`bg-card rounded-2xl p-6 shadow-card border-2 transition-all ${
                        String(plan.id) === String(currentPlan?.id) &&
                        displayStatus === "active"
                          ? "border-orange"
                          : String(plan.id) === selectedPlan &&
                            displayStatus === "pending"
                          ? "border-amber-500"
                          : "border-border/50 hover:border-orange/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${planColor} flex items-center justify-center mb-4`}
                      >
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-heading font-semibold text-lg mb-2">
                        {plan.name}
                      </h4>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-xl font-bold text-chocolate">
                            {plan.price === 0 || parseFloat(plan.price) === 0
                              ? "Free"
                              : `₦${parseInt(plan.price).toLocaleString()}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Product Limit
                          </p>
                          <p className="font-medium">
                            {plan.product_limit === 0
                              ? "No products"
                              : `${plan.product_limit} products/month`}
                          </p>
                        </div>
                      </div>
                      {String(plan.id) === String(currentPlan?.id) &&
                      displayStatus === "active" ? (
                        <Badge
                          variant="approved"
                          className="w-full justify-center py-2"
                        >
                          Current Plan
                        </Badge>
                      ) : String(plan.id) ===
                          String(currentSubscription?.plan_id) &&
                        displayStatus === "pending" ? (
                        <Badge
                          variant="pending"
                          className="w-full justify-center py-2"
                        >
                          Pending
                        </Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          className="w-full"
                          disabled={
                            user?.verification_status !== "approved" ||
                            (plan.slug === "basic" &&
                              displayStatus === "active" &&
                              currentPlan?.slug !== "basic")
                          }
                          title={
                            plan.slug === "basic" &&
                            displayStatus === "active" &&
                            currentPlan?.slug !== "basic"
                              ? "You already have an active plan"
                              : user?.verification_status !== "approved"
                              ? "Your store must be approved to purchase plans"
                              : ""
                          }
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          {parseFloat(plan.price) >
                          parseFloat(currentPlan?.price || 0)
                            ? "Upgrade"
                            : "Switch"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No subscription plans available
                </p>
              </div>
            )}
          </div>

          {/* Upgrade Payment Dialog */}
          <Dialog
            open={isUpgradeDialogOpen}
            onOpenChange={setIsUpgradeDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upgrade to {upgradingPlan?.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Account Details */}
                <div className="space-y-3">
                  <h4 className="font-heading font-semibold text-sm">
                    Transfer Payment To:
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {upgradingPlan?.bank_account_name ? (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Account Name
                          </p>
                          <p className="font-medium">
                            {upgradingPlan.bank_account_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Account Number
                          </p>
                          <p className="font-mono font-semibold text-lg">
                            {upgradingPlan.bank_account_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Bank</p>
                          <p className="font-medium">
                            {upgradingPlan.bank_name}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This plan has no payment details. Contact support for
                        more information.
                      </p>
                    )}
                    {upgradingPlan && parseFloat(upgradingPlan.price) > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-mono font-bold text-lg text-chocolate">
                          ₦{parseInt(upgradingPlan.price).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <h4 className="font-heading font-semibold text-sm">
                    Upload Payment Receipt
                  </h4>
                  <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-orange/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-foreground">
                      {paymentFile
                        ? paymentFile.name
                        : "Click to upload receipt"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PNG, JPG or PDF up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsUpgradeDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmitPayment}
                    disabled={!paymentFile || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
