
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, AlertTriangle, Loader2, Shield } from "lucide-react";
import React from "react";

export type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected';

export async function updateKYCStatus(
  documentId: string, 
  userId: string, 
  newStatus: KycStatus,
  adminNotes?: string
) {
  try {
    console.log(`Updating KYC status for document ${documentId}, user ${userId} to ${newStatus}`, {
      adminNotes
    });
    
    // Call the stored procedure that handles all updates in a transaction
    const { data, error } = await supabase.rpc("update_kyc_status", {
      document_id: documentId,
      user_id: userId,
      new_status: newStatus,
      admin_notes_param: adminNotes || null
    });
    
    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }
    
    console.log("KYC status update successful", data);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating KYC status:', error);
    toast.error('Failed to update KYC status');
    return { success: false, error };
  }
}

export function getKycStatusBadgeProps(status: KycStatus | null) {
  if (!status) return {
    variant: 'outline' as const,
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: React.createElement(Shield, { className: "h-3.5 w-3.5 mr-1" }),
    label: 'Unknown'
  };
  
  switch (status) {
    case 'verified':
      return {
        variant: 'outline' as const,
        className: 'bg-green-500/10 text-green-500 border-green-500/20',
        icon: React.createElement(ShieldCheck, { className: "h-3.5 w-3.5 mr-1" }),
        label: 'Verified'
      };
    case 'rejected':
      return {
        variant: 'outline' as const,
        className: 'bg-red-500/10 text-red-500 border-red-500/20',
        icon: React.createElement(AlertTriangle, { className: "h-3.5 w-3.5 mr-1" }),
        label: 'Rejected'
      };
    case 'processing':
      return {
        variant: 'outline' as const,
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        icon: React.createElement(Loader2, { className: "h-3.5 w-3.5 animate-spin mr-1" }),
        label: 'Processing'
      };
    default: // pending or any other status
      return {
        variant: 'outline' as const,
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        icon: React.createElement(Shield, { className: "h-3.5 w-3.5 mr-1" }),
        label: status.charAt(0).toUpperCase() + status.slice(1)
      };
  }
}
