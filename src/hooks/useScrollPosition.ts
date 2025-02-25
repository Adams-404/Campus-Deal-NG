import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollPosition = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const previousPath = useRef<string | null>(null);

  // Save scroll position before navigating away
  const saveScrollPosition = useCallback(() => {
    const scrollPosition = window.scrollY;
    const path = location.pathname;
    sessionStorage.setItem(`scrollPosition_${path}`, scrollPosition.toString());
    previousPath.current = path;
  }, [location.pathname]);

  // Restore scroll position when returning to the page
  const restoreScrollPosition = useCallback(() => {
    const savedPosition = sessionStorage.getItem('scrollPosition_/');
    if (savedPosition && previousPath.current !== '/') {
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: parseInt(savedPosition),
          behavior: 'instant'
        });
        // Double-check scroll position after a brief delay
        setTimeout(() => {
          const currentScroll = window.scrollY;
          const targetScroll = parseInt(savedPosition);
          if (currentScroll !== targetScroll) {
            window.scrollTo({
              top: targetScroll,
              behavior: 'instant'
            });
          }
        }, 100);
      });
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (location.pathname === '/') {
      restoreScrollPosition();
    } else {
      saveScrollPosition();
    }

    return () => {
      if (location.pathname === '/') {
        saveScrollPosition();
      }
    };
  }, [location.pathname, saveScrollPosition, restoreScrollPosition]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (location.pathname === '/') {
        saveScrollPosition();
      }
    };
  }, [location.pathname, saveScrollPosition]);

  return null;
}; 