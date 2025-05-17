
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  approveKYC, 
  rejectKYC,
  fetchKYCData 
} from "@/integrations/supabase/admin";
import { trackEvent } from "@/lib/analytics";

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: "pending" | "processing" | "verified" | "rejected";
  created_at: string;
  admin_notes?: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    kyc_status: string;
  }
}

export function KYCTab() {
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchKYC = async () => {
    try {
      setLoading(true);
      const data = await fetchKYCData();
      setKycDocuments(data);
      
      // Track analytics event
      trackEvent('admin_view_kyc');
    } catch (error: any) {
      toast.error("Failed to fetch KYC documents: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const filteredDocuments = kycDocuments.filter(doc => {
    if (filter === "all") return true;
    return doc.status === filter;
  });

  const handleDocumentSelect = (doc: KYCDocument) => {
    setSelectedDocument(doc);
    setAdminNotes(doc.admin_notes || "");
  };

  const handleDocumentPreview = (url: string) => {
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  const closeDocumentDialog = () => {
    setSelectedDocument(null);
    setAdminNotes("");
  };

  const handleApproveKYC = async () => {
    if (!selectedDocument) return;
    
    try {
      await approveKYC(selectedDocument.id, selectedDocument.user_id);
      toast.success("KYC document approved successfully");
      closeDocumentDialog();
      fetchKYC();
    } catch (error: any) {
      toast.error("Failed to approve KYC: " + (error.message || "Unknown error"));
    }
  };

  const handleRejectKYC = async () => {
    if (!selectedDocument || !adminNotes.trim()) {
      toast.error("Please provide rejection notes");
      return;
    }
    
    try {
      await rejectKYC(selectedDocument.id, selectedDocument.user_id, adminNotes);
      toast.success("KYC document rejected");
      closeDocumentDialog();
      fetchKYC();
    } catch (error: any) {
      toast.error("Failed to reject KYC: " + (error.message || "Unknown error"));
    }
  };

  const DocumentList = ({ documents }: { documents: KYCDocument[] }) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No KYC documents found for this filter.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-4" onClick={() => handleDocumentSelect(doc)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={doc.profile?.avatar_url} />
                    <AvatarFallback>
                      {doc.profile?.first_name?.[0]}
                      {doc.profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {doc.profile?.first_name} {doc.profile?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      doc.status === "verified"
                        ? "outline"
                        : doc.status === "rejected"
                        ? "destructive"
                        : doc.status === "processing"
                        ? "secondary"
                        : "secondary"
                    }
                    className={
                      doc.status === "verified"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : doc.status === "rejected"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : doc.status === "processing"
                        ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    }
                  >
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocumentPreview(doc.document_url);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">KYC Verification</h2>
        <Button variant="outline" onClick={fetchKYC}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          <DocumentList documents={filteredDocuments} />
        </TabsContent>
      </Tabs>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="aspect-video relative overflow-hidden rounded-md border">
              <img
                src={previewUrl}
                alt="Document Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Action Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={closeDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review KYC Document</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={selectedDocument.profile?.avatar_url} />
                  <AvatarFallback>
                    {selectedDocument.profile?.first_name?.[0]}
                    {selectedDocument.profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedDocument.profile?.first_name}{" "}
                    {selectedDocument.profile?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDocument.document_type}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDocumentPreview(selectedDocument.document_url)}
              >
                View Document
              </Button>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes (required for rejection)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 w-full"
                  onClick={handleApproveKYC}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRejectKYC}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KYCTab;
