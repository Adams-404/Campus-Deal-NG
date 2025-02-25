import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  className?: string;
  showZoom?: boolean;
  disableScroll?: boolean;
}

export const ImageCarousel = ({ 
  images, 
  className, 
  showZoom = false,
  disableScroll = false 
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zooms, setZooms] = useState<number[]>(new Array(images.length).fill(1));

  const currentZoom = zooms[currentIndex];

  const goToNext = () => {
    if (currentZoom > 1) return;
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentZoom > 1) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
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

  return (
    <div className={cn("relative group", className)}>
      {/* Image Counter - At top */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white z-20">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      <div className="relative overflow-hidden">
        <motion.div
          className="flex transition-transform"
          animate={{
            x: `${-currentIndex * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {images.map((image, index) => (
            <motion.div
              key={index}
              className="w-full flex-shrink-0"
              animate={{
                scale: zooms[index]
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <img 
                src={image} 
                alt={`Image ${index + 1}`} 
                className="w-full h-full object-cover"
                style={{ transformOrigin: 'center' }}
                draggable={false}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      {!disableScroll && currentZoom <= 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
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
}; 