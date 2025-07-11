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
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
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
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to avoid showing again for a while
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = touch.clientX;
    currentY.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    
    setTranslateX(deltaX);
    setTranslateY(deltaY);
    
    currentX.current = touch.clientX;
    currentY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If swiped more than 100px in any direction, dismiss
    if (distance > 100) {
      handleDismiss();
    } else {
      // Reset position
      setTranslateX(0);
      setTranslateY(0);
    }
    
    setIsDragging(false);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentX.current = e.clientX;
    currentY.current = e.clientY;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    
    setTranslateX(deltaX);
    setTranslateY(deltaY);
    
    currentX.current = e.clientX;
    currentY.current = e.clientY;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If dragged more than 100px in any direction, dismiss
    if (distance > 100) {
      handleDismiss();
    } else {
      // Reset position
      setTranslateX(0);
      setTranslateY(0);
    }
    
    setIsDragging(false);
  };

  // Don't show if already installed or recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - dismissedTime < oneDay) {
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
        transform: `translate(${translateX}px, ${translateY}px)`,
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
          
          {/* Swipe indicator */}
          <div className="flex justify-center mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>←</span>
              <span>Swipe to dismiss</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 