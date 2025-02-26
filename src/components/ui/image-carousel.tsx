import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  aspectRatio?: "square" | "video" | "product" | "full";
  showControls?: boolean;
  showZoom?: boolean;
  disableScroll?: boolean;
}

export function ImageCarousel({ 
  images, 
  className, 
  aspectRatio = "video",
  showControls = true,
  showZoom = false,
  disableScroll = false 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zooms, setZooms] = useState<number[]>(new Array(images.length).fill(1));

  const currentZoom = zooms[currentIndex];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleZoomIn = () => {
    setZooms(prev => {
      const newZooms = [...prev];
      newZooms[currentIndex] = Math.min(prev[currentIndex] + 0.25, 3);
      return newZooms;
    });
  };

  const handleZoomOut = () => {
    setZooms(prev => {
      const newZooms = [...prev];
      newZooms[currentIndex] = Math.max(prev[currentIndex] - 0.25, 1);
      return newZooms;
    });
  };

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    product: "aspect-[4/3]",
    full: "h-full"
  }[aspectRatio];

  if (!images.length) {
    return (
      <div className={cn(
        "relative bg-secondary flex items-center justify-center",
        aspectRatioClass,
        className
      )}>
        <span className="text-sm text-gray-400">No images</span>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Image Counter - At top */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white z-20">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      <div className={cn(
        "relative overflow-hidden rounded-lg",
        aspectRatioClass
      )}>
        {images.map((src, index) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {src.includes('video') ? (
              <video
                src={src}
                className="w-full h-full object-cover"
                controls={false}
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={src}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {showControls && images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={previous}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                )}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}

      {/* Zoom Controls */}
      {showZoom && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={currentZoom <= 1}
            className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={currentZoom >= 3}
            className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 