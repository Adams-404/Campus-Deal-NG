
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SellModal } from '@/components/SellModal';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  created_at: string;
  description?: string;
}

export default function MyListings() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UserItem[]>([]);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserItems();
  }, []);

  const fetchUserItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth/signin');
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          item_images (
            image_url
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      if (itemsData) {
        const formattedItems = itemsData.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          status: item.status,
          created_at: item.created_at,
          description: item.description,
          images: item.item_images?.map((img: any) => img.image_url) || []
        }));
        setItems(formattedItems);
      }
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, description?: string) => {
    // Check if item was deleted by admin
    const isAdminDeleted = description?.includes('[ADMIN DELETED]');
    const adminReason = isAdminDeleted && description
      ? description.split('[ADMIN DELETED] Reason:')[1]?.trim() 
      : '';
    
    if (status === 'deleted' && isAdminDeleted) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 cursor-help flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Removed by Admin
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{adminReason || 'Violated community guidelines'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
            Active
          </Badge>
        );
      case 'sold':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
            Sold
          </Badge>
        );
      case 'deleted':
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
            Deleted
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20">
            {status}
          </Badge>
        );
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
              <h1 className="text-xl font-semibold">My Listings</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className={cn(
                    "group relative aspect-square rounded-lg overflow-hidden border border-white/10 cursor-pointer",
                    item.status === 'deleted' && "opacity-70"
                  )}
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  <img 
                    src={item.images[0]} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                        {getStatusBadge(item.status, item.description)}
                      </div>
                      <p className="text-sm text-primary">₦{item.price}</p>
                      <p className="text-xs text-gray-400">
                        Listed {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">You haven't listed any items yet</p>
                <Button onClick={() => setIsSellModalOpen(true)} className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Listing
                </Button>
              </div>
            )}
          </div>
        </PageTransition>
      </main>

      <SellModal 
        isOpen={isSellModalOpen} 
        onClose={() => setIsSellModalOpen(false)} 
        onItemListed={() => { fetchUserItems(); setIsSellModalOpen(false); }} 
      />
    </div>
  );
}
