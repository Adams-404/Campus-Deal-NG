import { useEffect, useState, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  pullDownThreshold?: number;
  maxPullDown?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDown = 120
}: PullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return;

    const y = e.touches[0].clientY;
    const distance = Math.max(0, Math.min(y - startY, maxPullDown));
    setPullDistance(distance);

    // Prevent default scrolling while pulling
    if (distance > 0) {
      e.preventDefault();
    }
  }, [isPulling, startY, maxPullDown]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= pullDownThreshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  }, [isPulling, pullDistance, pullDownThreshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
    isPulling
  };
}; 