
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function updateKYCStatus(
  documentId: string, 
  userId: string, 
  newStatus: 'pending' | 'processing' | 'verified' | 'rejected',
  adminNotes?: string
) {
  try {
    // Update the KYC document
    const { error: docError } = await supabase
      .from('kyc_documents')
      .update({ 
        status: newStatus,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (docError) throw docError;
    
    // Update the user's profile KYC status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        kyc_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    // Create a notification for the user
    const title = newStatus === 'verified' 
      ? 'KYC Verification Approved' 
      : newStatus === 'rejected'
      ? 'KYC Verification Rejected'
      : 'KYC Status Updated';
    
    const content = adminNotes || (
      newStatus === 'verified' 
        ? 'Your identity verification has been approved. You now have full access to all platform features.'
        : newStatus === 'rejected'
        ? 'Your identity verification was rejected. Please submit new documents or contact support.'
        : 'Your identity verification status has been updated.'
    );
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        content,
        type: 'verification',
        is_read: false,
        metadata: { document_id: documentId }
      });
    
    if (notificationError) throw notificationError;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating KYC status:', error);
    toast.error('Failed to update KYC status');
    return { success: false, error };
  }
}

export function getKycStatusBadgeProps(status: string | null) {
  if (!status) return {
    variant: 'outline' as const,
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: null,
    label: 'Unknown'
  };
  
  switch (status) {
    case 'verified':
      return {
        variant: 'outline' as const,
        className: 'bg-green-500/10 text-green-500 border-green-500/20',
        icon: <ShieldCheck className="h-3.5 w-3.5 mr-1" />,
        label: 'Verified'
      };
    case 'rejected':
      return {
        variant: 'outline' as const,
        className: 'bg-red-500/10 text-red-500 border-red-500/20',
        icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
        label: 'Rejected'
      };
    case 'processing':
      return {
        variant: 'outline' as const,
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />,
        label: 'Processing'
      };
    default: // pending or any other status
      return {
        variant: 'outline' as const,
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        icon: <Shield className="h-3.5 w-3.5 mr-1" />,
        label: status.charAt(0).toUpperCase() + status.slice(1)
      };
  }
}

// Import these at the top of the file
import { ShieldCheck, AlertTriangle, Loader2, Shield } from "lucide-react";
