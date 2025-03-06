
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
    
    // Instead of calling the RPC function which is causing issues,
    // we'll perform a direct update to both the document and profile in sequence
    
    // 1. Update the KYC document
    const { error: docError } = await supabase
      .from('kyc_documents')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
      
    if (docError) {
      console.error('Document update error:', docError);
      throw docError;
    }
    
    // 2. Update the user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        kyc_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }
    
    // 3. Create a notification
    const notificationTitle = 
      newStatus === 'verified' ? 'KYC Verification Approved' :
      newStatus === 'rejected' ? 'KYC Verification Rejected' :
      'KYC Status Updated';
      
    const notificationContent = adminNotes || 
      (newStatus === 'verified' ? 'Your identity verification has been approved. You now have full access to all platform features.' :
      newStatus === 'rejected' ? 'Your identity verification was rejected. Please submit new documents or contact support.' :
      'Your identity verification status has been updated.');
    
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: notificationTitle,
        content: notificationContent,
        type: 'verification',
        created_at: new Date().toISOString(),
        is_read: false,
        metadata: { document_id: documentId }
      });
      
    if (notifError) {
      console.error('Notification creation error:', notifError);
      // We don't throw here as the main update was successful
      // Just log for debugging purposes
    }
    
    console.log("KYC status update successful");
    
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
