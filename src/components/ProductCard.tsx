
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
          navClassName="light:bg-white/80 light:text-[#1EAEDB] light:hover:bg-white/90 light:border light:border-[#1EAEDB]/30 dark:bg-black/50 dark:backdrop-blur-sm dark:hover:bg-black/70"
          imageCountClassName="light:bg-white/80 light:text-[#1EAEDB] light:border light:border-[#1EAEDB]/30 dark:bg-black/50 dark:backdrop-blur-sm"
        />
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={isLoading}
            className={cn(
              "dark:bg-black/50 dark:backdrop-blur-sm dark:hover:bg-black/70 light:bg-white/70 light:backdrop-blur-sm light:hover:bg-white/90 light:border",
              isSaved ? "light:text-[#ea384c] dark:text-red-500 light:border-[#ea384c]/30" : "light:text-gray-700 dark:text-white light:border-gray-300"
            )}
          >
            <Heart className={cn(
              "h-5 w-5",
              isSaved ? "fill-current" : ""
            )} />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className={cn(
            "font-medium dark:text-white light:text-gray-800 line-clamp-2 flex-1",
            fontSizeClass
          )}>{item.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewItem}
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 light:bg-[#1EAEDB]/10 light:text-[#1EAEDB] light:hover:bg-[#1EAEDB]/20 flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn(
            "font-semibold text-primary dark:text-primary light:text-[#1EAEDB]",
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
            <Avatar className="h-6 w-6 ring-2 ring-offset-2 ring-offset-background ring-primary/20 group-hover/profile:ring-primary/40 transition-all light:ring-[#1EAEDB]/30 light:group-hover/profile:ring-[#1EAEDB]/60">
              <AvatarImage src={item.seller?.avatar_url} />
              <AvatarFallback>
                <User className="h-3 w-3 text-primary light:text-[#1EAEDB]" />
              </AvatarFallback>
            </Avatar>
            {!hideSellerName && (
              <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 truncate group-hover/profile:text-primary light:group-hover/profile:text-[#1EAEDB] transition-colors">
                {item.seller?.first_name || 'Anonymous'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
