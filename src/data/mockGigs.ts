export interface Gig {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  location: string | null;
  duration: string | null;
  rating: number;
  reviews_count: number;
  tags: string[];
  user_id: string;
  is_active: boolean;
  status: 'active' | 'paused' | 'completed' | 'deleted';
  created_at: string;
  updated_at: string | null;
  // Joined data from queries
  gig_images?: Array<{ image_url: string; is_primary: boolean }>;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface GigApplication {
  id: string;
  gig_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string | null;
  gigs?: Gig;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}
