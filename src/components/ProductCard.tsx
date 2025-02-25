import { Heart, Eye, User } from "lucide-react";
import { Button } from "./ui/button";
import { ImageCarousel } from "./ui/image-carousel";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  image: string | string[];
  condition: string;
  seller?: {
    name: string;
    avatar?: string;
  };
}

export const ProductCard = ({ id, title, price, image, condition, seller }: ProductCardProps) => {
  const { fontSizeClass } = useSettings();
  const navigate = useNavigate();
  const images = Array.isArray(image) ? image : [image];

  const handleViewItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement like functionality
  };

  return (
    <div className="bg-secondary rounded-lg border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all animate-fadeIn group">
      <div className="relative aspect-square">
        <ImageCarousel images={images} />
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <Heart className="h-5 w-5 text-white" />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2 z-10">
          <span className={cn(
            "px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full font-medium text-white",
            fontSizeClass === 'large' ? 'text-base' : 'text-sm'
          )}>
            {condition}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className={cn(
            "font-medium text-white line-clamp-2 flex-1",
            fontSizeClass
          )}>{title}</h3>
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
          )}>₦{price}</p>
          {seller && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {seller.avatar ? (
                  <img 
                    src={seller.avatar} 
                    alt={seller.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-3 h-3 text-primary" />
                )}
              </div>
              <span className="text-sm text-gray-400 truncate">{seller.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
