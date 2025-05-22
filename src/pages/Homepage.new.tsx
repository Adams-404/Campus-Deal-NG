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
  condition?: string; // Added condition property for NLP filtering
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
        .eq('status', 'active');

      if (selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }

      const { data: itemsData, error: itemsError } = await query;

      if (itemsError) throw itemsError;

      if (!itemsData) {
        setItems([]);
        return;
      }

      // Format items with their images and seller information
      let formattedItems = itemsData.map(item => {
        const images = item.item_images || [];
        const allImages = images.map(img => img.image_url);
        const seller = item.profiles;

        return {
          id: item.id,
          title: item.title,
          price: item.price,
          category: item.category,
          condition: item.condition,
          created_at: item.created_at,
          images: allImages,
          seller: seller ? {
            id: seller.id,
            full_name: seller.first_name && seller.last_name 
              ? `${seller.first_name} ${seller.last_name}`
              : seller.first_name || seller.last_name || 'Anonymous',
            first_name: seller.first_name || 'Anonymous',
            last_name: seller.last_name,
            avatar_url: seller.avatar_url
          } : undefined,
          description: item.description
        };
      }).filter(item => item.images.length > 0);

      // Sort items if needed
      if (sortBy === 'newest') {
        formattedItems.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === 'price-low-high') {
        formattedItems.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high-low') {
        formattedItems.sort((a, b) => b.price - a.price);
      }
      
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
  }, [selectedCategories, sortBy]);

  const handleRefresh = useCallback(async () => {
    await fetchItems();
    toast.success("Content refreshed");
  }, []);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    
    return groups;
  }, [items]);

  // Find featured items
  const featuredItems = useMemo(() => {
    // For demo purposes, just consider the first few items as featured
    return items.filter(item => item.featured).length > 0 
      ? items.filter(item => item.featured)
      : items.slice(0, 3);
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

  // Filter items based on search query with advanced NLP-based filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    // Apply advanced filtering based on NLP extracted parameters
    return items.filter(item => {
      // Basic text matching
      const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Price range filtering from NLP extraction
      const matchesPriceRange = searchParams.priceRange ? (
        // Check min price if specified
        (searchParams.priceRange.min !== undefined ? 
          item.price >= searchParams.priceRange.min : true) &&
        // Check max price if specified
        (searchParams.priceRange.max !== undefined ? 
          item.price <= searchParams.priceRange.max : true)
      ) : true;
      
      // Condition filtering from NLP extraction
      const matchesCondition = searchParams.condition ? 
        item.condition?.toLowerCase() === searchParams.condition.toLowerCase() : true;
      
      // Category filtering - already handled by selectedCategories state
      
      // For very specific NLP queries, prioritize extracted parameters over text matching
      if (searchParams.priceRange || searchParams.condition) {
        return matchesPriceRange && matchesCondition;
      }
      
      // Otherwise use basic text matching
      return matchesQuery;
    });
  }, [items, searchQuery, searchParams]);

  // Determine grid columns based on device type
  const getGridCols = () => {
    switch(deviceType) {
      case 'mobile':
        return 'grid-cols-2';
      case 'tablet':
        return 'grid-cols-3';
      case 'desktop':
        return 'grid-cols-4 xl:grid-cols-5';
      default:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
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
              <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Market Hub</h1>
                  </div>
                  
                  {/* Search History and Spelling Suggestions */}
                  <SearchHistoryAndSuggestions onSelectQuery={(query) => {
                    setSearchQuery(query);
                    handleSearchSubmit(query);
                  }} />
                </div>
                
                {searchQuery && filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <h2 className="text-2xl font-bold mb-2">No results found</h2>
                    <p className="text-gray-500 mb-8">
                      No items match your search for "{searchQuery}".
                    </p>
                    
                    {/* AI-powered search suggestions */}
                    <EmptySearchSuggestions
                      searchQuery={searchQuery}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  </div>
                ) : (
                  <>
                    {searchQuery ? (
                      <section className="py-6 w-full">
                        <h2 className="text-2xl font-bold mb-6">Search Results</h2>
                        <div className={`grid ${getGridCols()} gap-4 w-full`}>
                          {filteredItems.map(item => (
                            <ProductCard key={item.id} item={item} />
                          ))}
                        </div>
                      </section>
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
                              />
                            ) : (
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                <ProductCard
                                  item={featuredItems[0]}
                                  className="w-full"
                                />
                                {featuredItems.length > 1 && (
                                  <ProductCard
                                    item={featuredItems[1]}
                                    className="w-full"
                                  />
                                )}
                                {featuredItems.length > 2 && deviceType === 'desktop' && (
                                  <ProductCard
                                    item={featuredItems[2]}
                                    className="w-full"
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
                                    />
                                  </div>
                                )}
                                
                                {/* Horizontal Scroll for Other Items on Mobile */}
                                {categoryItems.length > 1 && (
                                  <div className="overflow-x-auto pb-4">
                                    <div className="flex gap-4 w-max">
                                      {categoryItems.slice(1, 5).map(item => (
                                        <div key={item.id} className="w-48 md:w-64 flex-shrink-0">
                                          <ProductCard item={item} hideSellerName={true} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              /* Grid view for desktop and tablet */
                              <div className={`grid ${getGridCols()} gap-4 w-full`}>
                                {categoryItems.slice(0, deviceType === 'desktop' ? 15 : 9).map(item => (
                                  <ProductCard key={item.id} item={item} />
                                ))}
                              </div>
                            )}
                          </section>
                        ))}
                      </>
                    )}
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
