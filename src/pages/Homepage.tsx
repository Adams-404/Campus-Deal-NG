import { ProductGrid } from "@/components/ProductGrid";
import { PageTransition } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { useSearch } from "@/contexts/SearchContext";
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useDeviceType } from "@/hooks/use-mobile";
import { EmptySearchSuggestions } from "@/components/EmptySearchSuggestions";
import { SearchHistoryAndSuggestions } from "@/components/SearchHistoryAndSuggestions";
import { useTheme } from "@/contexts/ThemeContext";

type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

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
  featured?: boolean; // Made optional since it's not always present in the database
  description?: string;
  condition?: ItemCondition; // Used for NLP filtering
  status?: string; // Add status field to match database schema
}

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Homepage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { 
    searchQuery, 
    selectedCategories, 
    sortBy, 
    setSearchQuery, 
    setSelectedCategories,
    searchHistory,
    addToSearchHistory,
    clearSearchHistory,
    spellingSuggestion,
    setSpellingSuggestion,
    searchParams
  } = useSearch();
  const deviceType = useDeviceType();
  const { theme } = useTheme();

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching items with params:', {
        searchQuery,
        selectedCategories,
        searchParams,
        sortBy
      });
      
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
      if (searchQuery && (!searchParams.keywords || searchParams.keywords.length === 0)) {
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

      // Apply category filter if categories are selected or if a category was detected in search
      const categoriesToSearch = [
        ...selectedCategories,
        ...(searchParams.category ? [searchParams.category] : [])
      ].filter((v, i, a) => v && a.indexOf(v) === i); // Remove duplicates and empty values

      console.log('Categories to search:', categoriesToSearch);
      
      if (categoriesToSearch.length > 0) {
        console.log('Applying category filter:', categoriesToSearch);
        // Create an array of OR conditions for each category
        const categoryConditions = categoriesToSearch.flatMap(cat => {
          if (!cat) return [];
          return [
            `category.ilike.%${cat}%`,
            `title.ilike.%${cat}%`,
            `description.ilike.%${cat}%`
          ];
        }).filter(Boolean);
        
        if (categoryConditions.length > 0) {
          query = query.or(categoryConditions.join(','));
        } else {
          console.warn('No valid category conditions to apply');
        }
      } else {
        console.log('No categories to filter by');
      }

      // Apply price range filter
      if (searchParams.priceRange) {
        const { min, max } = searchParams.priceRange;
        console.log('Applying price range:', { min, max });
        
        if (min !== undefined) {
          query = query.gte('price', min);
        }
        if (max !== undefined) {
          query = query.lte('price', max);
        }
      }

      // Apply condition filter
      const validConditions: ItemCondition[] = ['new', 'like_new', 'good', 'fair', 'poor'];
      if (searchParams.condition && validConditions.includes(searchParams.condition as ItemCondition)) {
        console.log('Applying condition filter:', searchParams.condition);
        query = query.eq('condition', searchParams.condition as ItemCondition);
      }

      // Always apply keyword search if we have keywords
      // This ensures exact matches are always found
      if (searchParams.keywords && searchParams.keywords.length > 0) {
        console.log('Applying keyword search:', searchParams.keywords);
        
        // Create search conditions for each keyword
        const keywordConditions = searchParams.keywords.flatMap(keyword => {
          if (!keyword || keyword.length < 1) return [];
          const trimmedKeyword = keyword.trim();
          if (!trimmedKeyword) return [];
          
          // First try exact match (case insensitive)
          // Then try partial match with higher weight
          return [
            `title.ilike.${trimmedKeyword}`,  // Exact match first
            `title.ilike.%${trimmedKeyword}%`,  // Then partial match
            `description.ilike.%${trimmedKeyword}%`,
            `category.ilike.%${trimmedKeyword}%`
          ];
        }).filter(Boolean);
        
        console.log('Generated keyword conditions:', keywordConditions);
        
        // Only apply if we have valid conditions
        if (keywordConditions.length > 0) {
          console.log('Applying keyword conditions:', keywordConditions);
          query = query.or(keywordConditions.join(','));
        } else {
          console.warn('No valid keyword conditions to apply');
        }
      } else if (searchParams.keywords?.length > 0) {
        console.log('Skipping keyword search as categories are being used');
      } else {
        console.log('No keywords to search for');
      }
      
      // Log the actual SQL query for debugging
      console.log('Generated SQL query:', query);
      console.log('Query parameters:', {
        categories: categoriesToSearch,
        keywords: searchParams.keywords,
        priceRange: searchParams.priceRange,
        condition: searchParams.condition,
        sortBy
      });

      console.log('Executing query...');
      const { data: itemsData, error: itemsError, count } = await query;

      console.log('Query results:', { itemsData, itemsError });

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        throw itemsError;
      }

      if (!itemsData) {
        console.log('No data returned from query');
        setItems([]);
        return;
      }

      // Format items with their images and seller information
      let formattedItems = itemsData.map(item => {
        const images = item.item_images || [];
        const allImages = images.map(img => img.image_url);
        const seller = item.profiles;

        // Create a safe seller object with fallback values
        const safeSeller = {
          id: seller?.id || 'unknown',
          first_name: seller?.first_name || 'Anonymous',
          last_name: seller?.last_name || '',
          avatar_url: seller?.avatar_url || undefined,
          full_name: seller?.first_name && seller?.last_name
            ? `${seller.first_name} ${seller.last_name}`
            : seller?.first_name || seller?.last_name || 'Anonymous'
        };

        // Create the formatted item with all required fields
        const formattedItem: Item = {
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

        return formattedItem;
      }).filter(item => item.images.length > 0);

      // Shuffle all items before setting state
      formattedItems = shuffleArray(formattedItems);
      setItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast.error(error.message || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('items_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategories, sortBy, searchParams, searchQuery]);

  const handleRefresh = useCallback(async () => {
    await fetchItems();
    toast.success("Content refreshed");
  }, []);

  // Group items by category with shuffling
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    // Shuffle the order of items before grouping
    const shuffledItems = shuffleArray([...items]);
    shuffledItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    // Shuffle the order of categories
    const shuffledCategories = shuffleArray(Object.keys(groups));
    const shuffledGroups: Record<string, Item[]> = {};
    shuffledCategories.forEach(category => {
      shuffledGroups[category] = groups[category];
    });
    return shuffledGroups;
  }, [items]);

  // Find featured items
  const featuredItems = useMemo(() => {
    // For demo purposes, just consider the first few items as featured
    return items.slice(0, 3);
  }, [items]);

  // Handler for search suggestions
  const handleSuggestionClick = (suggestion: string) => {
    // Check if it's a category suggestion
    if (suggestion.startsWith('Category:')) {
      const category = suggestion.replace('Category:', '').trim();
      setSelectedCategories([category.toLowerCase()]);
      setSearchQuery(''); // Clear the search query
      return;
    }
    
    // Handle other suggestion types
    if (suggestion === 'View popular items') {
      setSearchQuery('');
      setSelectedCategories([]);
      return;
    }
    
    if (suggestion === 'Try a different price range') {
      // Just clear the search query but keep the category
      setSearchQuery('');
      return;
    }
    
    if (suggestion.startsWith('Browse all')) {
      // Extract the main term
      const term = suggestion.replace('Browse all', '').trim();
      const cleanTerm = term.endsWith('s') ? term.slice(0, -1) : term;
      setSearchQuery(cleanTerm);
      return;
    }
    
    if (suggestion.startsWith('Search for')) {
      // Extract the main term
      const term = suggestion.replace('Search for', '').replace('only', '').trim();
      setSearchQuery(term);
      return;
    }
    
    // Default: use suggestion as search query
    setSearchQuery(suggestion);
    
    // Add to search history when a suggestion is clicked
    addToSearchHistory(suggestion);
  };

  // Check spelling and offer corrections when search is performed
  useEffect(() => {
    // Only check spelling when there's a search query and it's not from clicking a suggestion
    if (searchQuery && searchQuery.length > 2) {
      import('@/utils/spellCheck').then(({ checkSpelling }) => {
        const suggestion = checkSpelling(searchQuery);
        setSpellingSuggestion(suggestion);
      });
    } else {
      setSpellingSuggestion(null);
    }
  }, [searchQuery, setSpellingSuggestion]);

  // Handle search submission - add to history
  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      addToSearchHistory(query);
    }
  };

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    // If we have search params from the context, let the server handle the filtering
    if (searchParams.keywords?.length || searchParams.priceRange || searchParams.condition) {
      return items;
    }
    
    // Only do client-side filtering if we have a search query
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [items, searchQuery, searchParams]);

  // Determine grid columns based on device type
  const getGridCols = () => {
    switch(deviceType) {
      case 'mobile':
        return 'grid-cols-2';
      case 'tablet':
        return 'grid-cols-2';
      case 'desktop':
        return 'grid-cols-3';
      default:
        return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  // Determine appropriate container padding based on device
  const getContainerPadding = () => {
    if (deviceType === 'mobile') {
      return 'px-4 pb-24 mt-14'; // Add margin top for mobile to fix spacing issue
    } else if (deviceType === 'tablet') {
      return 'px-6 pt-8 pb-8'; 
    } else {
      return 'px-8 pt-8 pb-8';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground w-full">
      <main className={`mx-auto ${getContainerPadding()} ${deviceType !== 'mobile' ? 'w-full' : ''}`}>
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            {loading ? (
              <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="w-full max-w-[100vw] px-0 sm:px-4 sm:mx-auto sm:max-w-7xl pb-8">
                <div className="flex flex-col mb-8">
                  {/* Search History and Spelling Suggestions */}
                  <SearchHistoryAndSuggestions onSelectQuery={(query) => {
                    setSearchQuery(query);
                    handleSearchSubmit(query);
                  }} />
                </div>
                
                {searchQuery ? (
                  loading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <section className="py-6 w-full">
                      <h2 className="text-2xl font-bold mb-6">
                        {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
                      </h2>
                      <div className={`grid ${getGridCols()} gap-6 w-full`}>
                        {filteredItems.map(item => (
                          <ProductCard key={item.id} item={item} showOnlyFirstName={true} />
                        ))}
                      </div>
                    </section>
                  )
                ) : (
                  <>
                    {/* Global Featured Items */}
                    {featuredItems.length > 0 && (
                      <section className="py-6 w-full">
                        <h2 className="text-2xl font-bold mb-6">Featured Items</h2>
                        {deviceType === 'mobile' ? (
                          <ProductCard
                            item={featuredItems[0]}
                            className="w-full"
                            showOnlyFirstName={true}
                          />
                        ) : (
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <ProductCard
                              item={featuredItems[0]}
                              className="w-full"
                              showOnlyFirstName={true}
                            />
                            {featuredItems.length > 1 && (
                              <ProductCard
                                item={featuredItems[1]}
                                className="w-full"
                                showOnlyFirstName={true}
                              />
                            )}
                            {featuredItems.length > 2 && deviceType === 'desktop' && (
                              <ProductCard
                                item={featuredItems[2]}
                                className="w-full"
                                showOnlyFirstName={true}
                              />
                            )}
                          </div>
                        )}
                      </section>
                    )}
                    
                    {/* Category Sections */}
                    {Object.entries(groupedItems).map(([category, categoryItems]) => (
                      <section key={category} className="py-6 w-full">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold capitalize">{category}</h2>
                          <Link
                            to={`/category/${category.toLowerCase()}`}
                            className="block text-sm text-white hover:underline border border-primary rounded-lg px-3 py-1 flex items-center gap-1"
                          >
                            See All <ArrowRight className="h-4 w-4 text-primary" />
                          </Link>
                        </div>
                        
                        {deviceType === 'mobile' ? (
                          <>
                            {/* Featured Item for Category on Mobile */}
                            {categoryItems.length > 0 && (
                              <div className="mb-6">
                                <ProductCard
                                  item={categoryItems[0]}
                                  className="w-full"
                                  showOnlyFirstName={true}
                                />
                              </div>
                            )}
                            
                            {/* Horizontal Scroll for Other Items on Mobile */}
                            {categoryItems.length > 1 && (
                              <div className="overflow-x-auto pb-4">
                                <div className="flex gap-4 w-max pl-4 sm:pl-0">
                                  {categoryItems.slice(1, 5).map(item => (
                                    <div key={item.id} className="w-48 md:w-64 flex-shrink-0">
                                      <ProductCard 
                                        item={item} 
                                        hideSellerName={true} 
                                        showOnlyFirstName={true} 
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Grid view for desktop and tablet */
                          <div className={`grid ${getGridCols()} gap-6 w-full`}>
                            {categoryItems.slice(0, deviceType === 'desktop' ? 15 : 9).map(item => (
                              <ProductCard 
                                key={item.id} 
                                item={item} 
                                showOnlyFirstName={true}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </>
                )}
              </div>
            )}
          </PageTransition>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default Homepage;
