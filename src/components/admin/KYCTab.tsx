
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";

// Type definitions
type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected';

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: KycStatus;
  created_at: string;
  admin_notes: string | null;
  updated_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface KYCTabProps {
  kycDocuments: KYCDocument[];
  onRefresh: () => Promise<void>;
}

export function KYCTab({ kycDocuments, onRefresh }: KYCTabProps) {
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generate signed URLs for documents when kycDocuments change
    const generateSignedUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const doc of kycDocuments) {
        // Extract the file path from the document_url
        try {
          const url = new URL(doc.document_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'kyc_documents');
          
          if (bucketIndex !== -1 && bucketIndex + 2 < pathParts.length) {
            const userId = pathParts[bucketIndex + 1];
            const fileName = pathParts[bucketIndex + 2];
            const filePath = `${userId}/${fileName}`;
            
            try {
              const { data, error } = await supabase.storage
                .from('kyc_documents')
                .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
              
              if (data && !error) {
                urls[doc.id] = data.signedUrl;
              } else {
                console.error("Error getting signed URL:", error);
              }
            } catch (error) {
              console.error("Error in createSignedUrl:", error);
            }
          }
        } catch (error) {
          console.error("Invalid URL format:", doc.document_url, error);
        }
      }
      
      setDocumentUrls(urls);
    };
    
    if (kycDocuments.length > 0) {
      generateSignedUrls();
    }
  }, [kycDocuments]);

  const handleKYCAction = async (documentId: string, userId: string, action: 'verify' | 'reject', notes?: string) => {
    try {
      const status = action === 'verify' ? 'verified' : 'rejected';

      const { error: docError } = await supabase
        .from('kyc_documents')
        .update({ 
          status: status as KycStatus,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (docError) throw docError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: status as KycStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success(`KYC ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <>
      {kycDocuments
        .filter(doc => doc.status === 'processing') // First show all documents in 'processing' status
        .map((doc) => (
          <Card key={doc.id} className="overflow-hidden border-orange-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {doc.profile.first_name} {doc.profile.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"
                >
                  Processing
                </Badge>
              </div>

              <div className="mt-4">
                {documentUrls[doc.id] ? (
                  <a 
                    href={documentUrls[doc.id]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  >
                    View Document
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-sm text-yellow-500">
                    Generating document link...
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleKYCAction(doc.id, doc.user_id, 'verify')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleKYCAction(doc.id, doc.user_id, 'reject')}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

      {kycDocuments
        .filter(doc => doc.status !== 'processing') // Then show all other documents
        .map((doc) => (
          <Card key={doc.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {doc.profile.first_name} {doc.profile.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={
                  doc.status === 'verified' 
                    ? 'outline' 
                    : doc.status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
                }
                className={
                  doc.status === 'verified'
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                    : doc.status === 'rejected'
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                }>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
              </div>

              <div className="mt-4">
                {documentUrls[doc.id] ? (
                  <a 
                    href={documentUrls[doc.id]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  >
                    View Document
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-sm text-yellow-500">
                    Generating document link...
                  </p>
                )}
              </div>

              {doc.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleKYCAction(doc.id, doc.user_id, 'verify')}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleKYCAction(doc.id, doc.user_id, 'reject')}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      
      {kycDocuments.length === 0 && (
        <Card className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No KYC verification documents submitted yet</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
