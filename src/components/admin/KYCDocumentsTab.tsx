
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, AlertTriangle, Loader2, Shield, Eye, CheckCircle, XCircle } from 'lucide-react';
import { KYCDocument } from './types';
import { updateKYCStatus } from '@/utils/kycUtils';
import { toast } from 'sonner';

interface KYCDocumentsTabProps {
  documents: KYCDocument[];
  onRefresh: () => void;
}

export const KYCDocumentsTab = ({ documents, onRefresh }: KYCDocumentsTabProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [viewingDocument, setViewingDocument] = useState<KYCDocument | null>(null);
  const [actionDialog, setActionDialog] = useState<{open: boolean, action: 'approve' | 'reject', document: KYCDocument | null}>({
    open: false,
    action: 'approve',
    document: null
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Rejected</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20"><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Processing</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Shield className="h-3.5 w-3.5 mr-1" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    }
  };

  const filteredDocuments = activeTab === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === activeTab);

  const handleAction = async () => {
    if (!actionDialog.document) return;
    
    setIsSubmitting(true);
    
    try {
      const newStatus = actionDialog.action === 'approve' ? 'verified' : 'rejected';
      
      const { success } = await updateKYCStatus(
        actionDialog.document.id,
        actionDialog.document.user_id,
        newStatus,
        adminNotes
      );
      
      if (success) {
        toast.success(`KYC document ${actionDialog.action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setActionDialog({ open: false, action: 'approve', document: null });
        setAdminNotes('');
        onRefresh(); // Refresh the documents list
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast.error(`Failed to ${actionDialog.action} document`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No documents found with this status.
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((document) => (
              <Card key={document.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={document.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {document.profile?.first_name?.[0] || ''}
                          {document.profile?.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {document.profile?.first_name} {document.profile?.last_name}
                        </CardTitle>
                        <CardDescription>
                          {new Date(document.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(document.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Document Type:</span>
                      <span className="ml-2 text-sm">
                        {document.document_type.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </div>
                    
                    {document.admin_notes && (
                      <div>
                        <span className="text-sm font-medium">Admin Notes:</span>
                        <p className="mt-1 text-sm border-l-2 border-primary/30 pl-2">
                          {document.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewingDocument(document)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View Document
                  </Button>
                  
                  {(document.status === 'pending' || document.status === 'processing') && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setActionDialog({
                          open: true,
                          action: 'reject',
                          document
                        })}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => setActionDialog({
                          open: true,
                          action: 'approve',
                          document
                        })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      
      {/* Document Viewer Dialog */}
      <Dialog open={viewingDocument !== null} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Viewing KYC Document</DialogTitle>
            <DialogDescription>
              Document uploaded by {viewingDocument?.profile?.first_name} {viewingDocument?.profile?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md overflow-hidden">
            <img 
              src={viewingDocument?.document_url} 
              alt="KYC Document" 
              className="w-full h-auto"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingDocument(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Approve/Reject Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => !open && setActionDialog({...actionDialog, open: false})}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} KYC Document
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve' 
                ? 'The user will be verified and gain full access to the platform.'
                : 'The user will need to submit new documents to get verified.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder={actionDialog.action === 'approve' 
                  ? "Additional information for the user..." 
                  : "Reason for rejection..."}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This note will be visible to the user in their notifications.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionDialog({...actionDialog, open: false});
              setAdminNotes('');
            }}>
              Cancel
            </Button>
            <Button 
              variant={actionDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
