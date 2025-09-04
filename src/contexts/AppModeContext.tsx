import React, { createContext, useContext, useState, useEffect } from 'react';

type AppMode = 'marketplace' | 'gigs';

interface AppModeContextType {
  currentMode: AppMode;
  setCurrentMode: (mode: AppMode) => void;
  isMarketplace: boolean;
  isGigs: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<AppMode>('marketplace');

  // Detect mode from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/gigs')) {
      setCurrentMode('gigs');
    } else {
      setCurrentMode('marketplace');
    }
  }, []);

  // Update URL when mode changes
  useEffect(() => {
    const path = window.location.pathname;
    if (currentMode === 'gigs' && !path.startsWith('/gigs')) {
      if (path === '/home' || path === '/') {
        window.history.pushState({}, '', '/gigs');
      }
    } else if (currentMode === 'marketplace' && path.startsWith('/gigs') && !path.includes('/gigs/')) {
      window.history.pushState({}, '', '/home');
    }
  }, [currentMode]);

  const value = {
    currentMode,
    setCurrentMode,
    isMarketplace: currentMode === 'marketplace',
    isGigs: currentMode === 'gigs'
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};