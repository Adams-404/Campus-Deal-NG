import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedItem {
  id: string;
  item: {
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
  };
}

export default function SavedItems() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth/signin');
        return;
      }

      const { data: savedItems, error } = await supabase
        .from('saved_items')
        .select(`
          id,
          item_id,
          items:item_id (
            id,
            title,
            price,
            item_images (
              image_url
            ),
            profiles:seller_id (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (savedItems) {
        const formattedItems = savedItems.map(item => ({
          id: item.id,
          item: {
            id: item.items.id,
            title: item.items.title,
            price: item.items.price,
            images: item.items.item_images?.map((img: any) => img.image_url) || [],
            seller: item.items.profiles ? {
              first_name: item.items.profiles.first_name,
              last_name: item.items.profiles.last_name,
              avatar_url: item.items.profiles.avatar_url,
              full_name: `${item.items.profiles.first_name || ''} ${item.items.profiles.last_name || ''}`.trim()
            } : undefined
          }
        }));
        setItems(formattedItems);
      }
    } catch (error: any) {
      console.error('Error fetching saved items:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItemId) return;

    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', selectedItemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== selectedItemId));
      toast.success('Item removed from saved items');
    } catch (error: any) {
      console.error('Error removing saved item:', error);
      toast.error(error.message);
    } finally {
      setShowDeleteDialog(false);
      setSelectedItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Saved Items</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((savedItem) => (
                <div 
                  key={savedItem.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-primary/20 transition-colors"
                >
                  <div 
                    onClick={() => navigate(`/item/${savedItem.item.id}`)}
                    className="absolute inset-0 z-10"
                  />
                  <img 
                    src={savedItem.item.images[0]} 
                    alt={savedItem.item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white line-clamp-2">{savedItem.item.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemId(savedItem.id);
                            setShowDeleteDialog(true);
                          }}
                          className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 relative z-20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-primary">₦{savedItem.item.price}</p>
                      {savedItem.item.seller && (
                        <p className="text-xs text-gray-400">
                          By {savedItem.item.seller.first_name || 'Anonymous'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">You haven't saved any items yet</p>
                <Button onClick={() => navigate('/home')} className="bg-primary/10 text-primary hover:bg-primary/20">
                  Browse Items
                </Button>
              </div>
            )}
          </div>
        </PageTransition>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Saved Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your saved items?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 