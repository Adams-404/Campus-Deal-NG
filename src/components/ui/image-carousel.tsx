import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageZoom } from './image-zoom';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export const ImageCarousel = ({ images, className }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [dragPosition, setDragPosition] = useState(0);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const position = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(position);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === 0) return;
    const position = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = position - dragStart;
    setDragPosition(delta);
  };

  const handleDragEnd = () => {
    if (Math.abs(dragPosition) > 50) {
      if (dragPosition > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (dragPosition < 0 && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    setDragStart(0);
    setDragPosition(0);
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <div 
        className="relative overflow-hidden"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <motion.div
          className="flex transition-transform"
          animate={{
            x: `${-currentIndex * 100 + (dragPosition / window.innerWidth) * 100}%`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0"
              style={{ touchAction: 'none' }}
            >
              <ImageZoom src={image} alt={`Image ${index + 1}`} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
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
    </div>
  );
}; 