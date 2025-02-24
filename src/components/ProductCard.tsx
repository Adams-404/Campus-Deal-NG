
import { Heart } from "lucide-react";
import { Button } from "./ui/button";

interface ProductCardProps {
  title: string;
  price: number;
  image: string;
  condition: string;
}

export const ProductCard = ({ title, price, image, condition }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all animate-fadeIn">
      <div className="relative aspect-square overflow-hidden">
        <img src={image} alt={title} className="object-cover w-full h-full" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <Heart className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
            {condition}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{title}</h3>
        <p className="text-lg font-semibold text-gray-900">${price}</p>
      </div>
    </div>
  );
};
