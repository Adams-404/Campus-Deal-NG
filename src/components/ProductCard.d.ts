
import { ReactNode } from 'react';

export interface ProductCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    seller?: {
      id: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
    created_at?: string;
  };
  className?: string;
  hideSellerName?: boolean;
}
