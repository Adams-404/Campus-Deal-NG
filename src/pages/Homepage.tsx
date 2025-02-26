
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { PageTransition } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

interface Item {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

const Homepage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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
          condition: item.condition,
          images: allImages,
          seller: seller ? {
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

  useScrollPosition();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            <section className="py-6 pb-32">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Trending Categories</h2>
                  <Categories />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-6">Featured Items</h2>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-full aspect-[16/9] animate-pulse bg-white/5 rounded-lg" />
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No items listed yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
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
