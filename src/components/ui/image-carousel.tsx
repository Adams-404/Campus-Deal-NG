
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  showArrows?: boolean;
  showImageCount?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "wide" | "vertical" | "full";
  navClassName?: string;
  imageCountClassName?: string;
  showZoom?: boolean;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  showArrows = true,
  showImageCount = true,
  className,
  aspectRatio = "video",
  navClassName,
  imageCountClassName,
  showZoom = false
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (!images || images.length === 0) {
    return (
      <div className={cn(
        "bg-secondary/50 flex items-center justify-center",
        className
      )}>
        <span className="text-muted-foreground">No image</span>
      </div>
    );
  }

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-[16/9]",
    wide: "aspect-[2/1]",
    vertical: "aspect-[9/16]",
    full: "aspect-[16/9]" // Added support for "full" type
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn(
      "relative w-full overflow-hidden bg-secondary/10", 
      aspectRatioClasses[aspectRatio],
      className
    )}>
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-300 ease-in-out",
            activeIndex === index ? "opacity-100" : "opacity-0"
          )}
        >
          <img
            src={image}
            alt={`Item image ${index + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      
      {showArrows && images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full",
              "light:bg-white/90 light:text-[#1EAEDB] light:hover:bg-white light:border light:border-[#1EAEDB]/30 dark:bg-black/50 dark:backdrop-blur-sm dark:hover:bg-black/70",
              navClassName
            )}
          >
            <ChevronLeft className="h-4 w-4 dark:text-white light:text-[#1EAEDB]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full",
              "light:bg-white/90 light:text-[#1EAEDB] light:hover:bg-white light:border light:border-[#1EAEDB]/30 dark:bg-black/50 dark:backdrop-blur-sm dark:hover:bg-black/70",
              navClassName
            )}
          >
            <ChevronRight className="h-4 w-4 dark:text-white light:text-[#1EAEDB]" />
          </Button>
        </>
      )}
      
      {showImageCount && images.length > 1 && (
        <div className={cn(
          "absolute bottom-2 right-2 z-10 px-2 py-1 rounded-md",
          "light:bg-white/90 light:text-[#1EAEDB] light:border light:border-[#1EAEDB]/30 dark:bg-black/50 dark:backdrop-blur-sm dark:text-white text-xs",
          imageCountClassName
        )}>
          {activeIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};
