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
  id: number;
  title: string;
  price: number;
  condition: string;
  seller_id: string;
  description: string;
  category: string;
  seller?: {
    name: string;
    avatar_url?: string;
  };
  primary_image?: string;
  all_images: string[];
  created_at: string;
}

const Homepage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // First, fetch items with their images
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          item_images!left (
            image_url,
            is_primary
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      if (!itemsData) {
        setItems([]);
        return;
      }

      // Get unique seller IDs
      const sellerIds = [...new Set(itemsData.map(item => item.seller_id))];

      // Fetch seller information
      const { data: sellersData, error: sellersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', sellerIds);

      if (sellersError) throw sellersError;

      // Create a map of seller information
      const sellersMap = (sellersData || []).reduce((acc, seller) => {
        acc[seller.id] = seller;
        return acc;
      }, {} as Record<string, any>);

      // Format items with their primary images and seller information
      const formattedItems = itemsData.map(item => {
        const images = item.item_images || [];
        const primaryImage = images.find(img => img.is_primary)?.image_url || 
                           images[0]?.image_url;
        const seller = sellersMap[item.seller_id];

        return {
          ...item,
          primary_image: primaryImage,
          all_images: images.map(img => img.image_url),
          seller: seller ? {
            name: seller.first_name || 'Anonymous', // Only show first name in card
            full_name: seller.first_name && seller.last_name 
              ? `${seller.first_name} ${seller.last_name}`
              : seller.first_name || seller.last_name || 'Anonymous',
            avatar_url: seller.avatar_url
          } : undefined
        };
      }).filter(item => item.primary_image); // Only show items with at least one image

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
                          id={item.id}
                          title={item.title}
                          price={item.price}
                          image={item.primary_image || ''}
                          images={item.all_images}
                          condition={item.condition}
                          seller={item.seller ? {
                            name: item.seller.name || 'Anonymous',
                            avatar: item.seller.avatar_url
                          } : undefined}
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
