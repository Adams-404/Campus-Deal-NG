import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const promptRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    // Register service worker manually
    if ('serviceWorker' in navigator) {
      // Clear old service workers first to avoid conflicts
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      }).then(() => {
        return navigator.serviceWorker.register('/sw.js');
      }).then((registration) => {
        console.log('SW registered: ', registration);
      }).catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if prompt was recently dismissed within the last year
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        const dismissalPeriod = 365 * 24 * 60 * 60 * 1000; // 365 days
        
        if (now - dismissedTime < dismissalPeriod) {
          return; // Do not show prompt
        }
      }

      // Add a small delay before showing the prompt
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000); // 2 second delay
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Save dismissal to localStorage so they are not prompted again
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to avoid showing again for a while (1 year)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Touch/Swipe handlers - only left/right
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    currentX.current = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    
    // Only allow horizontal movement
    setTranslateX(deltaX);
    
    currentX.current = touch.clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    
    // If swiped more than 80px left or right, dismiss
    if (Math.abs(deltaX) > 80) {
      handleDismiss();
    } else {
      // Reset position
      setTranslateX(0);
    }
    
    setIsDragging(false);
  };

  // Mouse drag handlers for desktop - only left/right
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX.current;
    
    // Only allow horizontal movement
    setTranslateX(deltaX);
    
    currentX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    
    // If dragged more than 80px left or right, dismiss
    if (Math.abs(deltaX) > 80) {
      handleDismiss();
    } else {
      // Reset position
      setTranslateX(0);
    }
    
    setIsDragging(false);
  };

  // Don't show if already installed or recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const dismissalPeriod = 365 * 24 * 60 * 60 * 1000; // 365 days
      
      if (now - dismissedTime < dismissalPeriod) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div 
      ref={promptRef}
      className={`fixed top-4 left-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-sm mx-auto backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 animate-in slide-in-from-top-2 duration-300 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'transition-none' : 'transition-transform duration-200'
      }`}
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: isDragging ? 0.8 : 1
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <img src="/logo.png" alt="Campus Deal" className="w-8 h-8" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Install Campus Deal
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Get the full app experience and quick launch
          </p>
          
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 