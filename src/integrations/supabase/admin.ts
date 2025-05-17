
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

/**
 * Fetch all users from Supabase
 */
export const fetchUsers = async () => {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
  
  // Track the analytics event
  trackEvent('admin_fetch_users');
  
  return users?.users || [];
};

/**
 * Delete a user from Supabase
 */
export const deleteUser = async (userId: string) => {
  try {
    // First delete profile and related data
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }
    
    // Then delete user from auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw error;
    }
    
    // Track the analytics event
    trackEvent('admin_delete_user', { userId });
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Approve a KYC document
 */
export const approveKYC = async (kycId: string, userId: string) => {
  try {
    // Update KYC document status
    const { error: docError } = await supabase
      .from('kyc_documents')
      .update({ status: 'verified' })
      .eq('id', kycId);
      
    if (docError) throw docError;
    
    // Update user profile KYC status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ kyc_status: 'verified' })
      .eq('id', userId);
      
    if (profileError) throw profileError;
    
    // Track the analytics event
    trackEvent('admin_approve_kyc', { kycId, userId });
    
    return { success: true };
  } catch (error) {
    console.error("Error approving KYC:", error);
    throw error;
  }
};

/**
 * Reject a KYC document
 */
export const rejectKYC = async (kycId: string, userId: string, notes: string) => {
  try {
    // Update KYC document status
    const { error: docError } = await supabase
      .from('kyc_documents')
      .update({ 
        status: 'rejected',
        admin_notes: notes
      })
      .eq('id', kycId);
      
    if (docError) throw docError;
    
    // Update user profile KYC status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ kyc_status: 'rejected' })
      .eq('id', userId);
      
    if (profileError) throw profileError;
    
    // Track the analytics event
    trackEvent('admin_reject_kyc', { kycId, userId });
    
    return { success: true };
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    throw error;
  }
};

/**
 * Fetch all KYC documents
 */
export const fetchKYCData = async () => {
  try {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select(`
        *,
        profile:profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          kyc_status
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Track the analytics event
    trackEvent('admin_fetch_kyc');
    
    return data || [];
  } catch (error) {
    console.error("Error fetching KYC data:", error);
    throw error;
  }
};
