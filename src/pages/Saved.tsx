import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { DesktopSideNav } from '@/components/DesktopSideNav';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { useMobile } from '@/hooks/use-mobile';

const Saved = () => {
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('saved_items')
        .select(`
          item_id,
          created_at,
          items:item_id (
            id,
            title,
            price,
            description,
            condition,
            status,
            location,
            created_at,
            item_images (
              id,
              url,
              is_primary
            ),
            profiles:seller_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Filter out any items that might have been deleted
      const validItems = data.filter(item => item.items).map(item => item.items);
      setSavedItems(validItems);
    } catch (error: any) {
      toast({
        title: "Error loading saved items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DesktopSideNav />
        <div className="flex-1">
          <div className="container max-w-4xl mx-auto px-4 pb-24 pt-6 md:pt-10">
            <h1 className="text-2xl font-bold mb-6">Saved Items</h1>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : savedItems.length > 0 ? (
              <ProductGrid items={savedItems} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">You haven't saved any items yet.</p>
                <button 
                  onClick={() => window.location.href = '/home'}
                  className="mt-4 bg-primary text-white px-4 py-2 rounded-md"
                >
                  Explore Items
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Saved;
