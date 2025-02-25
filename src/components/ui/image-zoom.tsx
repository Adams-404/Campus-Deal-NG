import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageZoom = ({ src, alt, className }: ImageZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = () => {
    if (isZoomed) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    } else {
      setScale(2);
      setIsZoomed(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      
      if (touchStartRef.current) {
        const timeDiff = now - touchStartRef.current.time;
        if (timeDiff < 300) {
          handleDoubleTap();
        }
      }
      
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isZoomed) return;

    if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const newScale = Math.max(1, Math.min(3, distance / 100));
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1) {
      // Handle pan
      const touch = e.touches[0];
      if (touchStartRef.current) {
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        setPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: touchStartRef.current.time
        };
      }
    }
  };

  const handleTouchEnd = () => {
    if (scale <= 1) {
      setIsZoomed(false);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden touch-none select-none",
        className
      )}
    >
      <motion.img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        animate={{
          scale,
          x: position.x,
          y: position.y
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag={isZoomed}
        dragConstraints={imageRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        dragElastic={0.1}
      />
    </div>
  );
}; 