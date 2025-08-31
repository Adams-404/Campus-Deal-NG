import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Item {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[];
  created_at: string;
  seller?: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  featured?: boolean;
  description?: string;
  condition?: string;
  status?: string;
}

interface FetchItemsParams {
  searchQuery?: string;
  selectedCategories?: string[];
  searchParams?: any;
  sortBy?: string;
  shuffle?: boolean;
  randomSeed?: number;
}

const fetchItems = async (params: FetchItemsParams): Promise<Item[]> => {
  const { searchQuery, selectedCategories, searchParams, sortBy, shuffle = true, randomSeed } = params;
  
  try {
    console.log('Fetching items with params:', { searchQuery, selectedCategories, searchParams, sortBy, shuffle, randomSeed });
    
    // Start building the query
    let query = supabase
      .from('items')
      .select(`
        *,
        item_images (
          image_url
        ),
        profiles:seller_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Handle search query if it exists and we don't have searchParams
    if (searchQuery && (!searchParams?.keywords || searchParams.keywords.length === 0)) {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 2);
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.flatMap(term => [
          `title.ilike.%${term}%`,
          `description.ilike.%${term}%`,
          `category.ilike.%${term}%`
        ]).filter(Boolean);
        
        if (searchConditions.length > 0) {
          query = query.or(searchConditions.join(','));
        }
      }
    }

    // Apply category filter if categories are selected
    if (selectedCategories && selectedCategories.length > 0) {
      const categoryConditions = selectedCategories.flatMap(cat => {
        if (!cat) return [];
        return [
          `category.ilike.%${cat}%`,
          `title.ilike.%${cat}%`,
          `description.ilike.%${cat}%`
        ];
      }).filter(Boolean);
      
      if (categoryConditions.length > 0) {
        query = query.or(categoryConditions.join(','));
      }
    }

    // Apply price range filter
    if (searchParams?.priceRange) {
      const { min, max } = searchParams.priceRange;
      if (min !== undefined) {
        query = query.gte('price', min);
      }
      if (max !== undefined) {
        query = query.lte('price', max);
      }
    }

    // Apply condition filter
    if (searchParams?.condition) {
      query = query.eq('condition', searchParams.condition);
    }

    // Apply keyword search if we have keywords
    if (searchParams?.keywords && searchParams.keywords.length > 0) {
      const keywordConditions = searchParams.keywords.flatMap(keyword => {
        if (!keyword || keyword.length < 1) return [];
        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword) return [];
        
        return [
          `title.ilike.${trimmedKeyword}`,
          `title.ilike.%${trimmedKeyword}%`,
          `description.ilike.%${trimmedKeyword}%`,
          `category.ilike.%${trimmedKeyword}%`
        ];
      }).filter(Boolean);
      
      if (keywordConditions.length > 0) {
        query = query.or(keywordConditions.join(','));
      }
    }

    const { data: itemsData, error: itemsError } = await query;

    if (itemsError) {
      throw itemsError;
    }

    if (!itemsData) {
      return [];
    }

    // Format items with their images and seller information
    let formattedItems = itemsData.map(item => {
      const images = item.item_images || [];
      const allImages = images.map(img => img.image_url);
      const seller = item.profiles;

      const safeSeller = {
        id: seller?.id || 'unknown',
        first_name: seller?.first_name || 'Anonymous',
        last_name: seller?.last_name || '',
        avatar_url: seller?.avatar_url || undefined,
        full_name: seller?.first_name && seller?.last_name
          ? `${seller.first_name} ${seller.last_name}`
          : seller?.first_name || seller?.last_name || 'Anonymous'
      };

      return {
        id: item.id,
        title: item.title,
        price: item.price,
        category: item.category,
        condition: item.condition,
        created_at: item.created_at,
        status: item.status || 'active',
        images: allImages,
        seller: safeSeller,
        description: item.description
      };
    }).filter(item => item.images.length > 0);

    // Shuffle items if requested (for homepage randomness)
    if (shuffle) {
      formattedItems = shuffleArray(formattedItems, randomSeed);
    }

    return formattedItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Helper function to shuffle arrays with optional seed for consistent but different shuffling
const shuffleArray = (array: any[], seed?: number) => {
  const newArray = [...array];
  
  // Use seed if provided, otherwise use Math.random()
  const random = seed ? (() => {
    let m = 0x80000000;
    let a = 1103515245;
    let c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * (m - 1));
    return () => {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  })() : Math.random;

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useItems = (params: FetchItemsParams) => {
  return useQuery({
    queryKey: ['items', params.searchQuery, params.selectedCategories, params.searchParams, params.sortBy, params.shuffle, params.randomSeed],
    queryFn: () => fetchItems(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

