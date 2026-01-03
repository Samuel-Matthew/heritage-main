import { useState, useEffect } from "react";
import {
  Clock,
  Flag,
  AlertCircle,
  CheckCircle,
  Eye,
  Trash2,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

interface StoreReport {
  id: string;
  store_id: string;
  store_name: string;
  reported_by: string;
  reporter_email: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes: string | null;
  created_at: string;
}

const reasonLabels: Record<string, string> = {
  inappropriate_content: "Inappropriate Content",
  fraudulent_activity: "Fraudulent Activity",
  poor_quality: "Poor Quality",
  fake_products: "Fake Products",
  misleading_information: "Misleading Information",
  unprofessional_behavior: "Unprofessional Behavior",
  scam: "Scam",
  other: "Other",
};

export default function StoreReports() {
  const [reports, setReports] = useState<StoreReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState<StoreReport | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "pending" | "reviewed" | "resolved" | "dismissed"
  >("reviewed");

  useEffect(() => {
    fetchReports();
  }, [selectedStatus]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params =
        selectedStatus !== "all" ? `?status=${selectedStatus}` : "";
      const response = await api.get(`/api/admin/reports${params}`);

      const reportsData = response.data.data || response.data;
      const reportsList = Array.isArray(reportsData) ? reportsData : [];

      setReports(reportsList);
    } catch (error: any) {
      // console.error("Failed to fetch reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (report: StoreReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
    setUpdateStatus(report.status);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;

    setIsUpdating(true);
    try {
      await api.patch(`/api/admin/reports/${selectedReport.id}/status`, {
        status: updateStatus,
        admin_notes: adminNotes,
      });

      toast.success("Report updated successfully");
      setIsDetailDialogOpen(false);
      fetchReports();
    } catch (error: any) {
      // console.error("Failed to update report:", error);
      toast.error("Failed to update report");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: StoreReport["status"]) => {
    switch (status) {
      case "pending":
        return "pending";
      case "reviewed":
        return "warning";
      case "resolved":
        return "success";
      case "dismissed":
        return "muted";
      default:
        return "default";
    }
  };

  const getReasonColor = (reason: string) => {
    if (reason === "scam" || reason === "fraudulent_activity")
      return "destructive";
    if (reason === "fake_products" || reason === "misleading_information")
      return "warning";
    return "default";
  };

  const statsCounts = {
    pending: reports.filter((r) => r.status === "pending").length,
    reviewed: reports.filter((r) => r.status === "reviewed").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Store Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and review buyer reports about stores
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {statsCounts.pending}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {statsCounts.reviewed}
              </p>
              <p className="text-sm text-muted-foreground">Reviewed</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {statsCounts.resolved}
              </p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {statsCounts.dismissed}
              </p>
              <p className="text-sm text-muted-foreground">Dismissed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No reports found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Store
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Reporter
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{report.store_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {report.store_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getReasonColor(report.reason)}>
                        {reasonLabels[report.reason] || report.reason}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">
                          {report.reported_by}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.reporter_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Store</p>
                  <p className="font-medium">{selectedReport.store_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <Badge
                    variant={getReasonColor(selectedReport.reason)}
                    className="mt-1"
                  >
                    {reasonLabels[selectedReport.reason] ||
                      selectedReport.reason}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reported By</p>
                  <p className="font-medium">{selectedReport.reported_by}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.reporter_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Reported</p>
                  <p className="font-medium">
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div>
                  <p className="text-sm font-medium mb-2">Report Description</p>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm text-foreground">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={updateStatus}
                    onValueChange={(value: any) => setUpdateStatus(value)}
                  >
                    <SelectTrigger id="status" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="admin_notes">Admin Notes</Label>
                  <Textarea
                    id="admin_notes"
                    placeholder="Add notes about this report..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
