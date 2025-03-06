
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KYCDocumentsTab } from "./KYCDocumentsTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, FileText, Calendar, User as UserIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { KYCDocument } from "./types";
import { cn } from "@/lib/utils";
import { KycStatus, updateKYCStatus, getKycStatusBadgeProps } from "@/utils/kycUtils";

export function KYCTab() {
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<KycStatus | 'all'>('all');

  const fetchKYCDocuments = async () => {
    try {
      console.log("Fetching KYC documents with activeTab:", activeTab);
      
      // Query kyc_documents with proper join to profiles
      let query = supabase
        .from('kyc_documents')
        .select(`
          id,
          user_id,
          document_type,
          document_url,
          status,
          created_at,
          admin_notes,
          updated_at,
          profile:profiles(
            first_name,
            last_name,
            avatar_url,
            kyc_status
          )
        `);

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching KYC documents:", error);
        throw error;
      }

      console.log("Fetched KYC documents:", data?.length);
      setKycDocuments(data || []);
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      toast.error('Failed to fetch KYC documents');
    }
  };

  useEffect(() => {
    fetchKYCDocuments();
    
    // Listen for changes in KYC documents and profiles
    const channel = supabase
      .channel('kyc-documents-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kyc_documents'
      }, (payload) => {
        console.log("KYC document change detected:", payload);
        fetchKYCDocuments();
      })
      .subscribe();

    // Listen for changes in profiles to catch KYC status updates
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: 'kyc_status=eq.processing,kyc_status=eq.verified,kyc_status=eq.rejected,kyc_status=eq.pending'
      }, (payload) => {
        console.log("Profile KYC status change detected:", payload);
        fetchKYCDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(profilesChannel);
    };
  }, [activeTab]);

  const handleViewDocument = (document: KYCDocument) => {
    setSelectedDocument(document);
    setAdminNotes(document.admin_notes || "");
    setIsViewerOpen(true);
  };

  const handleStatusUpdate = async (status: KycStatus) => {
    if (!selectedDocument) return;
    
    setUpdatingStatus(true);
    
    try {
      console.log(`Updating KYC status for document ${selectedDocument.id} to ${status}...`);
      
      const result = await updateKYCStatus(
        selectedDocument.id,
        selectedDocument.user_id,
        status,
        adminNotes
      );
      
      if (result.success) {
        toast.success(`KYC document ${status === 'verified' ? 'approved' : 'rejected'} successfully`);
        
        // Update the selected document and the documents list with the new status
        setSelectedDocument(prev => prev ? {...prev, status} : null);
        setKycDocuments(prev => 
          prev.map(doc => 
            doc.id === selectedDocument.id 
              ? { ...doc, status } 
              : doc
          )
        );
        
        // Close the viewer and refresh the documents after a short delay
        setTimeout(() => {
          setIsViewerOpen(false);
          fetchKYCDocuments();
        }, 500);
      } else {
        console.error("Error updating KYC status:", result.error);
        toast.error("Failed to update KYC status");
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast.error('Failed to update KYC status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">KYC Verification Documents</h2>
        <Button size="sm" onClick={fetchKYCDocuments} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as KycStatus | 'all')}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab}>
          <KYCDocumentsTab 
            documents={kycDocuments} 
            onViewDocument={handleViewDocument}
            onStatusChange={(documentId, newStatus) => {
              const document = kycDocuments.find(doc => doc.id === documentId);
              if (document) {
                setSelectedDocument(document);
                handleStatusUpdate(newStatus);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Document Review</DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedDocument.profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedDocument.profile.first_name?.[0]}
                      {selectedDocument.profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedDocument.profile.first_name} {selectedDocument.profile.last_name}
                    </p>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {selectedDocument.document_type}
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={cn(
                    selectedDocument.status === 'verified' && "bg-green-500/10 text-green-500 border-green-500/20",
                    selectedDocument.status === 'rejected' && "bg-red-500/10 text-red-500 border-red-500/20",
                    selectedDocument.status === 'processing' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                    selectedDocument.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  )}
                >
                  {selectedDocument.status}
                </Badge>
              </div>
              
              <Card>
                <CardContent className="p-4 flex justify-center">
                  <img 
                    src={selectedDocument.document_url} 
                    alt="KYC Document" 
                    className="max-w-full rounded-md shadow-md" 
                  />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Admin Notes</h3>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this document (will be visible to the user)"
                  rows={3}
                />
              </div>

              {(selectedDocument.status === 'pending' || selectedDocument.status === 'processing') && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updatingStatus}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleStatusUpdate('verified')}
                    disabled={updatingStatus}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
