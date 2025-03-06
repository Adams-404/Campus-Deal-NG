
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Check, X } from "lucide-react";
import { KYCDocument } from "./types";
import { cn } from "@/lib/utils";
import { KycStatus, getKycStatusBadgeProps } from "@/utils/kycUtils";
import { toast } from "sonner";

export interface KYCDocumentsTabProps {
  documents: KYCDocument[];
  onViewDocument: (document: KYCDocument) => void;
  onStatusChange: (documentId: string, newStatus: KycStatus) => void;
}

export function KYCDocumentsTab({ 
  documents, 
  onViewDocument, 
  onStatusChange 
}: KYCDocumentsTabProps) {
  const handleStatusChange = (documentId: string, newStatus: KycStatus) => {
    try {
      onStatusChange(documentId, newStatus);
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
          <p className="text-muted-foreground text-center">
            No KYC documents matching the selected criteria were found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => {
        const statusBadgeProps = getKycStatusBadgeProps(document.status as KycStatus);
        
        return (
          <Card key={document.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="md:col-span-2 p-6 bg-secondary/30 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={document.profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {document.profile.first_name?.[0]}
                        {document.profile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {document.profile.first_name} {document.profile.last_name}
                      </p>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(document.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={statusBadgeProps.variant}
                    className={cn("self-start my-1", statusBadgeProps.className)}
                  >
                    {statusBadgeProps.icon}
                    {statusBadgeProps.label}
                  </Badge>
                  
                  <p className="text-sm mt-2 font-medium">
                    {document.document_type}
                  </p>
                </div>
                
                <div className="md:col-span-3 p-6 flex items-center justify-center">
                  <div className="relative group aspect-[3/2] w-full max-w-[300px] rounded-md overflow-hidden bg-black/5 flex items-center justify-center border">
                    <img 
                      src={document.document_url} 
                      alt="ID Document"
                      className="object-contain max-h-full max-w-full"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button 
                        variant="secondary" 
                        className="shadow-lg"
                        onClick={() => onViewDocument(document)}
                      >
                        View Document
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 p-6 flex flex-col items-start justify-center">
                  {(document.status === 'pending' || document.status === 'processing') ? (
                    <div className="space-y-3 w-full">
                      <Button
                        className="w-full justify-start bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleStatusChange(document.id, 'verified')}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatusChange(document.id, 'rejected')}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onViewDocument(document)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onViewDocument(document)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
