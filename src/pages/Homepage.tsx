import { Categories } from "@/components/Categories";
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
import { Heart } from 'lucide-react';

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
}

const Homepage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, selectedCategories, sortBy } = useSearch();

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const { data: itemsData, error: itemsError } = await supabase
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

      if (itemsError) throw itemsError;

      if (!itemsData) {
        setItems([]);
        return;
      }

      // Format items with their images and seller information
      const formattedItems = itemsData.map(item => {
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
          } : undefined
        };
      }).filter(item => item.images.length > 0); // Only show items with at least one image

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

    // Subscribe to changes in the items table
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
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchItems();
    toast.success("Content refreshed");
  }, []);

  // Filter and sort items based on search context
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query)
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter(item =>
        selectedCategories.includes(item.category)
      );
    }

    // Sort items
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      // Add more sorting options as needed
    }

    return result;
  }, [items, searchQuery, selectedCategories, sortBy]);

  useScrollPosition();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            <section className="py-6 pb-32">
              <div className="space-y-8">
                <div>
                  <Categories />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-6">
                    {searchQuery ? 'Search Results' : 'Featured Items'}
                  </h2>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-full aspect-[16/9] animate-pulse bg-white/5 rounded-lg" />
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      {searchQuery ? 'No items found matching your search' : 'No items listed yet'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredItems.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </PageTransition>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default Homepage;
