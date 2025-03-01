
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KYCDocument } from "@/components/admin/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Eye, ShieldCheck, Loader2, Shield } from "lucide-react";

interface KYCDocumentsTabProps {
  kycDocuments: KYCDocument[];
  onViewKYCDocument: (document: KYCDocument) => void;
}

export function KYCDocumentsTab({ kycDocuments, onViewKYCDocument }: KYCDocumentsTabProps) {
  const getKycStatusColors = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-500',
          hover: 'hover:bg-green-500/20',
          border: 'border-green-500/20',
          icon: <ShieldCheck className="h-3.5 w-3.5 mr-1" />
        };
      case 'rejected':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-500',
          hover: 'hover:bg-red-500/20',
          border: 'border-red-500/20',
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        };
      case 'processing':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-500',
          hover: 'hover:bg-orange-500/20',
          border: 'border-orange-500/20',
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        };
      default:
        return {
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-500',
          hover: 'hover:bg-yellow-500/20',
          border: 'border-yellow-500/20',
          icon: <Shield className="h-3.5 w-3.5 mr-1" />
        };
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4">KYC Verification Requests</h2>
        <div className="space-y-4">
          {kycDocuments.length > 0 ? (
            kycDocuments.map(document => (
              <div 
                key={document.id} 
                className="border border-blue-200/30 rounded-lg p-4 bg-white/5 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{document.profile.first_name?.[0]}{document.profile.last_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{document.profile.first_name} {document.profile.last_name}</p>
                      <p className="text-xs text-muted-foreground">Document Type: {document.document_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        getKycStatusColors(document.status).bg,
                        getKycStatusColors(document.status).text,
                        getKycStatusColors(document.status).hover,
                        getKycStatusColors(document.status).border
                      )}
                    >
                      {getKycStatusColors(document.status).icon}
                      {document.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(document.created_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewKYCDocument(document)}
                      className="ml-2"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No KYC documents found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
