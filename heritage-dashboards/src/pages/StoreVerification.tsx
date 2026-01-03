import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

interface Document {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  is_mandatory: boolean;
  file_path: string;
}

interface Store {
  id: string;
  name: string;
  owner: string;
  owner_email: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rc_number: string;
  business_lines: string[];
  products_count: number;
  documents: Document[];
  created_at: string;
}

const mockStore = {
  id: "1",
  name: "PetroMax Nigeria",
  owner: "John Adeyemi",
  email: "john@petromax.ng",
  phone: "+234 801 234 5678",
  address: "25 Marina Road, Victoria Island",
  state: "Lagos",
  status: "pending" as const,
  registeredAt: "2024-01-15",
  description:
    "Leading supplier of petroleum products and industrial lubricants in Lagos State. Serving the oil and gas industry for over 15 years.",
  documents: [
    {
      id: "1",
      name: "CAC Certificate",
      type: "pdf",
      status: "pending",
      url: "#",
    },
    {
      id: "2",
      name: "Tax Clearance",
      type: "pdf",
      status: "pending",
      url: "#",
    },
    {
      id: "3",
      name: "Business License",
      type: "image",
      status: "pending",
      url: "#",
    },
    {
      id: "4",
      name: "ID Verification",
      type: "image",
      status: "pending",
      url: "#",
    },
  ],
};

export default function StoreVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [zoom, setZoom] = useState(100);
  const [docActionType, setDocActionType] = useState<
    "approve" | "reject" | null
  >(null);
  const [docReason, setDocReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchStore();
  }, [id]);

  useEffect(() => {
    if (store && store.documents.length > 0 && !selectedDoc) {
      setSelectedDoc(store.documents[0]);
    }
  }, [store]);

  const fetchStore = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/admin/stores/${id}`);
      setStore(response.data);
    } catch (error) {
      toast.error("Failed to load store details");
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const allDocumentsApproved = () => {
    if (!store) return false;
    return store.documents.every((doc) => doc.status === "approved");
  };

  const handleDocApprove = async () => {
    if (!selectedDoc) return;
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/documents/${selectedDoc.id}/approve`, {});
      toast.success("Document approved");
      setDocActionType(null);
      fetchStore();
    } catch (error) {
      toast.error("Failed to approve document");
      // console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDocReject = async () => {
    if (!selectedDoc || !docReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/documents/${selectedDoc.id}/reject`, {
        reason: docReason,
      });
      toast.success("Document rejected");
      setDocActionType(null);
      setDocReason("");
      fetchStore();
    } catch (error) {
      toast.error("Failed to reject document");
      // console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!store) return;
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/stores/${store.id}/approve`, {});
      toast.success("Store approved successfully!");
      navigate("/admin/stores");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to approve store";
      toast.error(message);
      // console.error(
      //   "Store approve error:",
      //   error.response?.data || error.message
      // );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error("Please provide rejection notes");
      return;
    }
    if (!store) return;
    try {
      setIsActionLoading(true);
      await api.patch(`/api/admin/stores/${store.id}/reject`, {
        rejection_reason: adminNotes,
      });
      toast.error("Store has been rejected");
      navigate("/admin/stores");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reject store";
      toast.error(message);
      // console.error(
      //   "Store reject error:",
      //   error.response?.data || error.message
      // );
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading store details...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/stores")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {store.name}
            </h1>
            <Badge
              variant={
                store.status === "pending"
                  ? "secondary"
                  : store.status === "approved"
                  ? "default"
                  : "destructive"
              }
            >
              {store.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Review store details and documents for verification
          </p>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Store Details */}
        <div className="space-y-6">
          {/* Company Details */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Company Details
            </h3>
            <div className="space-y-4">
              <DetailRow
                icon={Building2}
                label="Company Name"
                value={store.name}
              />
              <DetailRow icon={Mail} label="Email" value={store.email} />
              <DetailRow icon={Phone} label="Phone" value={store.phone} />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={`${store.address}, ${store.state}`}
              />
              <DetailRow
                icon={Calendar}
                label="Registered"
                value={store.created_at}
              />
            </div>
            <Separator className="my-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Business Info
              </p>
              <p className="text-sm">
                RC Number: <span className="font-mono">{store.rc_number}</span>
              </p>
              <p className="text-sm mt-1">
                Products:{" "}
                <span className="font-semibold">{store.products_count}</span>
              </p>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Submitted Documents
            </h3>
            <div className="space-y-2">
              {store.documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    selectedDoc?.id === doc.id
                      ? "border-orange bg-orange/5"
                      : "border-border hover:border-orange/50"
                  }`}
                >
                  <FileText
                    className={`h-5 w-5 ${
                      selectedDoc?.id === doc.id
                        ? "text-orange"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="flex-1 text-left font-medium">
                    {doc.type}
                  </span>
                  <Badge
                    variant={doc.status as "pending" | "approved" | "rejected"}
                    className="text-xs"
                  >
                    {doc.status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Notes & Actions */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Store Decision
            </h3>
            {!allDocumentsApproved() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  ⚠️ All documents must be approved before you can approve this
                  store.
                </p>
              </div>
            )}
            <Textarea
              placeholder="Add verification notes or rejection reasons..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleApprove}
                disabled={isActionLoading || !allDocumentsApproved()}
              >
                <Check className="h-4 w-4 mr-2" />
                {isActionLoading ? "Approving..." : "Approve Store"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                onClick={handleReject}
                disabled={isActionLoading}
              >
                <X className="h-4 w-4 mr-2" />
                {isActionLoading ? "Rejecting..." : "Reject Store"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Document Viewer */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden flex flex-col min-h-[600px]">
          {/* Viewer Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h4 className="font-medium">{selectedDoc?.type}</h4>
              <p className="text-sm text-muted-foreground">
                Document{" "}
                {selectedDoc?.is_mandatory ? "(Mandatory)" : "(Optional)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (selectedDoc?.file_path) {
                    window.open(
                      `${
                        import.meta.env.VITE_API_BASE_URL ||
                        "http://localhost:8000"
                      }/storage/${selectedDoc.file_path}`,
                      "_blank"
                    );
                  }
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Document Preview */}
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-8 overflow-auto">
            <div
              className="bg-card rounded-lg shadow-lg border border-border transition-transform"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {selectedDoc?.file_path ? (
                (() => {
                  const fileUrl = `${
                    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
                  }/storage/${selectedDoc.file_path}`;
                  const fileExtension = selectedDoc.file_path
                    .split(".")
                    .pop()
                    ?.toLowerCase();

                  // Image files
                  if (
                    ["jpg", "jpeg", "png", "gif", "webp"].includes(
                      fileExtension || ""
                    )
                  ) {
                    return (
                      <img
                        src={fileUrl}
                        alt={selectedDoc.type}
                        className="max-w-full max-h-[600px] rounded"
                      />
                    );
                  }

                  // PDF files
                  if (fileExtension === "pdf") {
                    return (
                      <iframe
                        src={`${fileUrl}#toolbar=0`}
                        className="w-[600px] h-[600px] rounded"
                        title={selectedDoc.type}
                      />
                    );
                  }

                  // Fallback for unsupported types
                  return (
                    <div className="w-[400px] h-[500px] bg-muted/50 rounded flex flex-col items-center justify-center gap-4">
                      <FileText className="h-16 w-16 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        {selectedDoc.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Preview not available for this file type
                      </p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange hover:underline"
                      >
                        Download to view
                      </a>
                    </div>
                  );
                })()
              ) : (
                <div className="w-[400px] h-[500px] bg-muted/50 rounded flex flex-col items-center justify-center gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">
                    No document selected
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Actions */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedDoc?.status as "pending" | "approved" | "rejected"
                }
              >
                {selectedDoc?.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => setDocActionType("approve")}
                disabled={selectedDoc?.status === "approved"}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve Doc
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => setDocActionType("reject")}
                disabled={selectedDoc?.status === "rejected"}
              >
                <X className="h-4 w-4 mr-1" />
                Reject Doc
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Document Dialog */}
      <Dialog
        open={docActionType === "approve"}
        onOpenChange={() => setDocActionType(null)}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Approve Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this{" "}
              <span className="font-semibold text-foreground">
                {selectedDoc?.type}
              </span>{" "}
              document?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setDocActionType(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDocApprove}
              disabled={isActionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActionLoading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog
        open={docActionType === "reject"}
        onOpenChange={() => setDocActionType(null)}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this{" "}
              <span className="font-semibold text-foreground">
                {selectedDoc?.type}
              </span>{" "}
              document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-reason">Rejection Reason</Label>
              <Textarea
                id="doc-reason"
                placeholder="Enter the reason for rejection..."
                value={docReason}
                onChange={(e) => setDocReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setDocActionType(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDocReject}
              disabled={isActionLoading || !docReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActionLoading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-orange" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
