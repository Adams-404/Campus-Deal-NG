
import { Heart, Eye, User } from "lucide-react";
import { Button } from "./ui/button";
import { ImageCarousel } from "./ui/image-carousel";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, ReactNode } from "react";
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
  showOnlyFirstName?: boolean;
  className?: string;
}

export const ProductCard = ({ item, hideSellerName, showOnlyFirstName = false, className }: ProductCardProps) => {
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

      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', item.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking saved status:', error);
        return;
      }

      setIsSaved(!!data);
    } catch (error) {
      console.error('Error in checkIfSaved:', error);
    }
  };

  const handleViewItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${item.id}`);
  };

  const handleViewProfile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { id } = item.seller || {};
    
    if (!id || id === 'unknown') {
      return;
    }
    
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

  // Just leave the title as plain text for simpler rendering
  // We'll handle emoji colors with CSS only

  return (
    <div className={cn(
      "bg-secondary rounded-lg border border-white/10 dark:border-white/10 light:border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all animate-fadeIn group relative",
      className
    )}>
      <div className="relative aspect-[16/9] pb-10">
        <ImageCarousel 
          images={item.images} 
          navClassName="light:bg-white/90 light:text-[#1078a7] light:hover:bg-white light:border light:border-[#1078a7] light:shadow-sm dark:bg-black/50 dark:backdrop-blur-sm dark:hover:bg-black/70"
          imageCountClassName="light:bg-white/90 light:text-[#1078a7] light:border light:border-[#1078a7] light:shadow-sm dark:bg-black/50 dark:backdrop-blur-sm"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={isLoading}
            className={cn(
              "h-14 w-14 rounded-full backdrop-blur-sm transition-all",
              "dark:bg-black/50 dark:hover:bg-black/70",
              "light:bg-white/95 light:hover:bg-white",
              "shadow-xl border-2 border-white/20",
              isSaved 
                ? "text-red-500 hover:text-red-500/90 dark:text-red-400 dark:hover:text-red-300" 
                : "text-[#1078a7] hover:text-[#0d5f8a] dark:text-white dark:hover:text-gray-200"
            )}
          >
            <Heart className={cn(
              "h-12 w-12 scale-110",
              isSaved ? "fill-current" : ""
            )} />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 
            className={cn(
              "flex-1 dark:text-white text-gray-800 emoji-container truncate",
              fontSizeClass,
              {
                'text-base': fontSizeClass === 'small',
                'text-lg': fontSizeClass === 'medium',
                'text-xl': fontSizeClass === 'large',
              }
            )}
            title={item.title}
          >
            {item.title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewItem}
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 light:bg-[#1EAEDB]/10 light:text-[#1EAEDB] light:hover:bg-[#1EAEDB]/20 flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-white/10 light:border-gray-200">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group/profile"
              onClick={handleViewProfile}
            >
              <div className="flex-shrink-0">
                <Avatar 
                  className="h-8 w-8 ring-2 ring-offset-2 ring-offset-background ring-primary/20 group-hover/profile:ring-primary/40 transition-all light:ring-[#1EAEDB]/30 light:group-hover/profile:ring-[#1EAEDB]/60"
                  onClick={item.seller?.id && item.seller.id !== 'unknown' ? handleViewProfile : undefined}
                  style={{ cursor: item.seller?.id && item.seller.id !== 'unknown' ? 'pointer' : 'default' }}
                >
                  <AvatarImage src={item.seller?.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary dark:bg-white/10 dark:text-white">
                    {item.seller?.first_name?.[0] || item.seller?.last_name?.[0] || <User className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>
              </div>
              {!hideSellerName && (
                <span className="text-sm font-medium text-muted-foreground group-hover/profile:text-foreground transition-colors line-clamp-1">
                  {showOnlyFirstName 
                    ? item.seller?.first_name || item.seller?.last_name || 'Anonymous'
                    : `${item.seller?.first_name || ''} ${item.seller?.last_name || ''}`.trim() || 'Anonymous'}
                </span>
              )}
            </div>
          </div>
          <p className={cn(
            "font-semibold text-primary dark:text-primary light:text-[#1EAEDB]",
            {
              'text-xl': fontSizeClass === 'large',
              'text-lg': fontSizeClass === 'medium',
              'text-base': fontSizeClass === 'small',
            }
          )}>₦{formatPrice(item.price)}</p>
        </div>
      </div>
    </div>
  );
};
