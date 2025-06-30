import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'verified' | 'rejected';
  admin_notes?: string;
  created_at: string;
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const KYCTab = () => {
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchKYCDocuments();
  }, []);

  const fetchKYCDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          profiles!user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(doc => ({
        ...doc,
        user: {
          first_name: doc.profiles?.first_name,
          last_name: doc.profiles?.last_name,
          email: doc.profiles?.email
        }
      })) || [];

      setKycDocuments(formattedData);
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      toast.error('Failed to fetch KYC documents');
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async (documentId: string, userId: string, newStatus: 'verified' | 'rejected', notes?: string) => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_kyc_status', {
        document_id: documentId,
        user_id: userId,
        new_status: newStatus,
        admin_notes_param: notes || null
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to update KYC status');
      }

      toast.success(`KYC status updated to ${newStatus}`);
      await fetchKYCDocuments();
      setSelectedDocument(null);
      setAdminNotes("");
    } catch (error: any) {
      console.error('Error updating KYC status:', error);
      toast.error(error.message || 'Failed to update KYC status');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = (doc: KYCDocument) => {
    updateKYCStatus(doc.id, doc.user_id, 'verified', adminNotes);
  };

  const handleReject = (doc: KYCDocument) => {
    updateKYCStatus(doc.id, doc.user_id, 'rejected', adminNotes);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'verified' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : status === 'rejected' ? (
      <XCircle className="w-4 h-4 text-red-500" />
    ) : null;
  };

  const exportData = () => {
    const csvContent = [
      ['User Name', 'Email', 'Document Type', 'Status', 'Submission Date', 'Admin Notes'],
      ...kycDocuments.map(doc => [
        `${doc.user.first_name || ''} ${doc.user.last_name || ''}`.trim() || 'N/A',
        doc.user.email || 'N/A',
        doc.document_type,
        doc.status,
        new Date(doc.created_at).toLocaleDateString(),
        doc.admin_notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kyc-documents.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredDocuments = kycDocuments.filter(doc =>
    `${doc.user.first_name || ''} ${doc.user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Document Verification</CardTitle>
          <CardDescription>Loading KYC documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>KYC Document Verification</CardTitle>
            <CardDescription>
              Review and verify user identity documents
            </CardDescription>
          </div>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or document type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No documents found matching your search.' : 'No KYC documents found.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {`${doc.user.first_name || ''} ${doc.user.last_name || ''}`.trim() || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">{doc.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{doc.document_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          {getStatusBadge(doc.status)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setAdminNotes(doc.admin_notes || "");
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review KYC Document</DialogTitle>
                            </DialogHeader>
                            {selectedDocument && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">User:</label>
                                    <p>{`${selectedDocument.user.first_name || ''} ${selectedDocument.user.last_name || ''}`.trim()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email:</label>
                                    <p>{selectedDocument.user.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Document Type:</label>
                                    <p className="capitalize">{selectedDocument.document_type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Current Status:</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getStatusIcon(selectedDocument.status)}
                                      {getStatusBadge(selectedDocument.status)}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Document:</label>
                                  <div className="mt-2 border rounded-lg p-4">
                                    <img
                                      src={selectedDocument.document_url}
                                      alt="KYC Document"
                                      className="max-w-full max-h-96 object-contain mx-auto"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Admin Notes:</label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes about this verification..."
                                    className="mt-1"
                                  />
                                </div>

                                {selectedDocument.status === 'pending' && (
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => handleApprove(selectedDocument)}
                                      disabled={updating}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() => handleReject(selectedDocument)}
                                      disabled={updating}
                                      variant="destructive"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCTab;
