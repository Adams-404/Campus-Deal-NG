
import { useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollPosition = () => {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const scrollPositions = useRef<Map<string, number>>(new Map());

  // Save scroll position before navigating away
  const saveScrollPosition = useCallback((path: string, position: number) => {
    scrollPositions.current.set(path, position);
    previousPath.current = path;
  }, []);

  // Restore scroll position when returning to the page
  const restoreScrollPosition = useCallback((path: string) => {
    const savedPosition = scrollPositions.current.get(path);
    if (savedPosition !== undefined && previousPath.current !== path) {
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant'
        });
      });
    }
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    saveScrollPosition: (position: number) => saveScrollPosition(location.pathname, position),
    restoreScrollPosition: () => restoreScrollPosition(location.pathname),
    currentPath: location.pathname
  }), [location.pathname, saveScrollPosition, restoreScrollPosition]);
};
