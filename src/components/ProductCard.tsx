import { Heart, Eye, User } from "lucide-react";
import { Button } from "./ui/button";
import { ImageCarousel } from "./ui/image-carousel";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ProductCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    images: string[];
    condition?: string;
    seller?: {
      full_name?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  };
}

export const ProductCard = ({ item }: ProductCardProps) => {
  const { fontSizeClass } = useSettings();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [item.id]);

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('saved_items')
        .select()
        .eq('user_id', user.id)
        .eq('item_id', item.id)
        .single();

      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleViewItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${item.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to save items');
        return;
      }

      if (isSaved) {
        // Remove from saved items
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', item.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success('Item removed from saved items');
      } else {
        // Add to saved items
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            item_id: item.id
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success('Item saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-secondary rounded-lg border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all animate-fadeIn group">
      <div className="relative aspect-[16/9]">
        <ImageCarousel 
          images={item.images} 
          showZoom={true}
        />
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={isLoading}
            className={cn(
              "bg-black/50 backdrop-blur-sm hover:bg-black/70",
              isSaved && "text-red-500"
            )}
          >
            <Heart className={cn(
              "h-5 w-5",
              isSaved ? "fill-current" : "text-white"
            )} />
          </Button>
        </div>
        {item.condition && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className={cn(
              "px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full font-medium text-white",
              fontSizeClass === 'large' ? 'text-base' : 'text-sm'
            )}>
              {item.condition}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className={cn(
            "font-medium text-white line-clamp-2 flex-1",
            fontSizeClass
          )}>{item.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewItem}
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn(
            "font-semibold text-primary",
            {
              'text-xl': fontSizeClass === 'large',
              'text-lg': fontSizeClass === 'medium',
              'text-base': fontSizeClass === 'small',
            }
          )}>₦{item.price}</p>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={item.seller?.avatar_url} />
              <AvatarFallback>
                <User className="h-3 w-3 text-primary" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-400 truncate">
              {item.seller?.first_name || 'Anonymous'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
