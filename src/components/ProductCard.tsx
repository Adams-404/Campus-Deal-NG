import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { ImageCarousel } from "./ui/image-carousel";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  title: string;
  price: number;
  image: string | string[];
  condition: string;
}

export const ProductCard = ({ title, price, image, condition }: ProductCardProps) => {
  const { fontSizeClass } = useSettings();
  const images = Array.isArray(image) ? image : [image];

  return (
    <div className="bg-secondary rounded-lg border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all animate-fadeIn">
      <div className="relative aspect-square">
        <ImageCarousel images={images} />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-sm hover:bg-black/70"
        >
          <Heart className="h-5 w-5 text-white" />
        </Button>
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
        <h3 className={cn(
          "font-medium text-white mb-2 line-clamp-2",
          fontSizeClass
        )}>{title}</h3>
        <p className={cn(
          "font-semibold text-primary",
          {
            'text-xl': fontSizeClass === 'large',
            'text-lg': fontSizeClass === 'medium',
            'text-base': fontSizeClass === 'small',
          }
        )}>₦{price}</p>
      </div>
    </div>
  );
};
