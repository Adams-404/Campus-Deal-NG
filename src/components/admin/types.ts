
export type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string | null;
  email?: string;
}

export interface UserRole {
  role: 'admin' | 'user';
}

export interface KYCDocument {
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
    avatar_url?: string | null;
  };
}

export interface UserProfile extends Profile {
  roles: UserRole[] | null;
}

export interface ItemType {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  description: string;
  seller: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  images: string[];
}
