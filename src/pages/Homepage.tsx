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
import { ArrowRight } from 'lucide-react';

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
          } : undefined,
          featured: item.featured
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

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    // Shuffle items in each category
    Object.keys(groups).forEach(category => {
      groups[category] = shuffleArray(groups[category]);
    });
    return groups;
  }, [items]);

  // Find featured items
  const featuredItems = useMemo(() => {
    return items.filter(item => item.featured);
  }, [items]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            {/* Global Featured Item */}
            {featuredItems.length > 0 && (
              <section className="py-6">
                <h2 className="text-2xl font-bold mb-6">Featured Item</h2>
                <ProductCard
                  item={featuredItems[0]}
                  className="w-full"
                />
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

                {/* Featured Item for Category */}
                <div className="mb-6">
                  <ProductCard
                    item={categoryItems[0]}
                    className="w-full"
                  />
                </div>

                {/* Horizontal Scroll for Other Items */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 w-max">
                    {categoryItems.slice(1, 5).map(item => (
                      <div key={item.id} className="w-64 flex-shrink-0">
                        <ProductCard item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </PageTransition>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default Homepage;
