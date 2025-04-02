
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected';

export interface KycStatusBadgeProps {
  variant: 'outline';
  className: string;
}

export const getKycStatusBadgeProps = (status: KycStatus): KycStatusBadgeProps => {
  switch (status) {
    case 'verified':
      return {
        variant: 'outline',
        className: 'bg-green-500/10 text-green-500 border-green-500/20'
      };
    case 'rejected':
      return {
        variant: 'outline',
        className: 'bg-red-500/10 text-red-500 border-red-500/20'
      };
    case 'processing':
      return {
        variant: 'outline',
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      };
    case 'pending':
    default:
      return {
        variant: 'outline',
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      };
  }
};

interface UpdateKYCStatusResponse {
  success: boolean;
  error?: {
    message: string;
    code?: string;
  };
}

export const updateKYCStatus = async (
  documentId: string,
  userId: string,
  status: KycStatus,
  adminNotes: string = ''
): Promise<UpdateKYCStatusResponse> => {
  try {
    const { data, error } = await supabase.rpc('update_kyc_status', {
      document_id: documentId,
      user_id: userId,
      new_status: status,
      admin_notes_param: adminNotes
    });

    // Parse the response from the DB function
    const result = data || {};
    
    if (error) {
      console.error('Error from RPC function:', error);
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code
        }
      };
    }
    
    // Our function returns a JSON object with a success property
    if (typeof result === 'object' && 'success' in result && result.success === true) {
      return { success: true };
    }
    
    // Handle the case where the function didn't return success: true
    return {
      success: false,
      error: {
        message: 'Unknown error updating KYC status'
      }
    };
  } catch (error: any) {
    console.error('Exception in updateKYCStatus:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Unknown error occurred'
      }
    };
  }
};
