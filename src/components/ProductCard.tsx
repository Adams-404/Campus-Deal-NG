
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
      id?: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
    featured?: boolean;
    description?: string;
  };
  hideSellerName?: boolean;
  className?: string;
}

export const ProductCard = ({ item, hideSellerName, className }: ProductCardProps) => {
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

  const handleViewProfile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { id } = item.seller || {};
    
    if (!id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    if (id === currentUserId) {
        navigate('/profile');
    } else {
        navigate(`/user/${id}`);
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <div className={cn(
      "bg-secondary rounded-lg border border-white/10 dark:border-white/10 light:border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all animate-fadeIn group",
      className
    )}>
      <div className="relative aspect-[16/9]">
        <ImageCarousel 
          images={item.images} 
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
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className={cn(
            "font-medium dark:text-white light:text-foreground line-clamp-2 flex-1",
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
          )}>₦{formatPrice(item.price)}</p>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group/profile"
            onClick={handleViewProfile}
          >
            <Avatar className="h-6 w-6 ring-2 ring-offset-2 ring-offset-background ring-primary/20 group-hover/profile:ring-primary/40 transition-all">
              <AvatarImage src={item.seller?.avatar_url} />
              <AvatarFallback>
                <User className="h-3 w-3 text-primary" />
              </AvatarFallback>
            </Avatar>
            {!hideSellerName && (
              <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 truncate group-hover/profile:text-primary transition-colors">
                {item.seller?.first_name || 'Anonymous'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
