import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";

interface Document {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  is_mandatory: boolean;
  file_path: string;
  created_at: string;
  rejection_reason?: string;
}

interface Store {
  id: string;
  name: string;
  status: string;
  documents: Document[];
}

const requiredDocuments = [
  {
    name: "CAC Certificate",
    description: "Corporate Affairs Commission registration certificate",
  },
  {
    name: "Tax Clearance Certificate",
    description: "Valid tax clearance from FIRS or State IRS",
  },
  {
    name: "Business License",
    description: "Operating license for your business category",
  },
  {
    name: "ID Verification",
    description: "Valid government-issued ID of business owner",
  },
];

export default function Documents() {
  const [store, setStore] = useState<Store | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchStoreDocuments();
  }, []);

  const fetchStoreDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/my-store");
      setStore(response.data);
      setDocuments(response.data.documents || []);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to load your documents";
      console.error("Error fetching documents:", message);
      // Only show error toast if it's not a 404 (store not found)
      if (error.response?.status !== 404) {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusVariant = (status: Document["status"]) => {
    switch (status) {
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      case "pending":
        return "pending";
    }
  };

  const handleReupload = (docId: string) => {
    toast.info("Please select a file to upload");
  };

  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const rejectedCount = documents.filter((d) => d.status === "rejected").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading your documents...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your store verification documents
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="font-semibold text-blue-900">No Store Found</p>
          <p className="text-sm text-blue-800 mt-2">
            You need to create a store first to upload documents. Complete your
            store registration to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your store verification documents
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {approvedCount}
              </p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {pendingCount}
              </p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chocolate">
                {rejectedCount}
              </p>
              <p className="text-sm text-muted-foreground">Needs Attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Alert */}
      {rejectedCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">
              Documents Require Attention
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Some of your documents have been rejected. Please review and
              re-upload the required documents.
            </p>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`bg-card rounded-2xl p-6 shadow-card border-2 transition-all ${
              doc.status === "rejected"
                ? "border-destructive/50"
                : "border-border/50"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange" />
                </div>
                <div>
                  <h4 className="font-medium">{doc.type}</h4>
                  <p className="text-sm text-muted-foreground">
                    {doc.is_mandatory ? "Mandatory" : "Optional"}
                  </p>
                </div>
              </div>
              {getStatusIcon(doc.status)}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={getStatusVariant(doc.status)}>
                  {doc.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploaded</span>
                <span>{doc.created_at}</span>
              </div>
            </div>

            {doc.status === "rejected" && doc.rejection_reason && (
              <div className="bg-destructive/10 rounded-lg p-3 mb-4">
                <p className="text-sm text-destructive">
                  {doc.rejection_reason}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedDoc(doc)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              {doc.status === "rejected" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleReupload(doc.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-upload
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.type}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
            {selectedDoc?.file_path ? (
              (() => {
                const fileUrl = `${
                  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
                }/storage/${selectedDoc.file_path}`;
                const fileExtension = selectedDoc.file_path
                  .split(".")
                  .pop()
                  ?.toLowerCase();

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

                if (fileExtension === "pdf") {
                  return (
                    <iframe
                      src={`${fileUrl}#toolbar=0`}
                      className="w-full h-[600px] rounded"
                      title={selectedDoc.type}
                    />
                  );
                }

                return (
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Preview not available</p>
                  </div>
                );
              })()
            ) : (
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No document selected</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedDoc(null)}>
              Close
            </Button>
            <Button variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Required Documents Section - MOVED TO TOP */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <h3 className="font-heading font-semibold mb-6 text-lg">
          Uploaded Documents
        </h3>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {doc.status === "approved" && (
                    <CheckCircle className="h-6 w-6 text-success" />
                  )}
                  {doc.status === "pending" && (
                    <Clock className="h-6 w-6 text-warning" />
                  )}
                  {doc.status === "rejected" && (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{doc.type}</h4>
                  <p className="text-sm text-muted-foreground">
                    {doc.is_mandatory ? "Mandatory" : "Optional"} • Uploaded{" "}
                    {doc.created_at}
                  </p>
                </div>
                {doc.status === "rejected" && doc.rejection_reason && (
                  <div className="text-xs text-destructive bg-destructive/10 px-3 py-1 rounded-lg max-w-xs">
                    {doc.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
