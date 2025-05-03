
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
import { useIsMobile } from "@/hooks/use-mobile";

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
}

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const Homepage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, selectedCategories, sortBy } = useSearch();
  const isMobile = useIsMobile();

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
          featured: item.featured,
          description: item.description
        };
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
  }, [selectedCategories]);

  const handleRefresh = useCallback(async () => {
    await fetchItems();
    toast.success("Content refreshed");
  }, []);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    // Shuffle the order of items before grouping
    const shuffledItems = shuffleArray(items);
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
    return items.filter(item => item.featured);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    const results = items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
    
    return results;
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={`mx-auto px-4 sm:px-6 ${isMobile ? 'max-w-3xl' : 'max-w-6xl'}`}>
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            {loading ? (
              <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <> 
                {searchQuery && filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                    <h2 className="text-2xl font-bold mb-4">No results found</h2>
                    <p className="text-gray-500">
                      No items match your search for "{searchQuery}".
                    </p>
                  </div>
                ) : (
                  <>
                    {searchQuery ? (
                      <section className="py-6">
                        <h2 className="text-2xl font-bold mb-6">Search Results</h2>
                        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'} gap-4`}>
                          {filteredItems.map(item => (
                            <ProductCard key={item.id} item={item} />
                          ))}
                        </div>
                      </section>
                    ) : (
                      <>
                        {/* Global Featured Item */}
                        {featuredItems.length > 0 && (
                          <section className="py-6">
                            <h2 className="text-2xl font-bold mb-6">Featured Item</h2>
                            {isMobile ? (
                              <ProductCard
                                item={featuredItems[0]}
                                className="w-full"
                              />
                            ) : (
                              <div className="grid grid-cols-2 gap-6">
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
                              </div>
                            )}
                          </section>
                        )}

                        {/* Category Sections */}
                        {Object.entries(groupedItems).map(([category, categoryItems]) => (
                          <section key={category} className="py-6">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-2xl font-bold capitalize">{category}</h2>
                              <Link
                                to={`/category/${category.toLowerCase()}`}
                                className="block text-sm text-white hover:underline border border-primary rounded-lg px-3 py-1 flex items-center gap-1"
                              >
                                See All <ArrowRight className="h-4 w-4 text-primary" />
                              </Link>
                            </div>

                            {isMobile ? (
                              <>
                                {/* Featured Item for Category on Mobile */}
                                <div className="mb-6">
                                  <ProductCard
                                    item={categoryItems[0]}
                                    className="w-full"
                                  />
                                </div>

                                {/* Horizontal Scroll for Other Items on Mobile */}
                                <div className="overflow-x-auto pb-4">
                                  <div className="flex gap-4 w-max">
                                    {categoryItems.slice(1, 5).map(item => (
                                      <div key={item.id} className="w-48 md:w-64 flex-shrink-0">
                                        <ProductCard item={item} hideSellerName={true} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Grid view for desktop */
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {categoryItems.slice(0, 10).map(item => (
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
              </>
            )}
          </PageTransition>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default Homepage;
