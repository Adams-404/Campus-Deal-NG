import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type AppMode = 'marketplace' | 'gigs' | 'events' | 'news' | 'study' | 'lost' | 'room';

interface AppModeContextType {
  currentMode: AppMode;
  setCurrentMode: (mode: AppMode) => void;
  isMarketplace: boolean;
  isGigs: boolean;
  isEvents: boolean;
  isNews: boolean;
  isStudy: boolean;
  isLost: boolean;
  isRoom: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    return (localStorage.getItem('appMode') as AppMode) || 'marketplace';
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Detect mode from URL
  useEffect(() => {
    const path = location.pathname;
    let detectedMode: AppMode | null = null;

    if (path.startsWith('/gigs')) {
      detectedMode = 'gigs';
    } else if (path.startsWith('/events')) {
      detectedMode = 'events';
    } else if (path.startsWith('/news')) {
      detectedMode = 'news';
    } else if (path.startsWith('/study')) {
      detectedMode = 'study';
    } else if (path.startsWith('/lost-and-found')) {
      detectedMode = 'lost';
    } else if (path.startsWith('/roommates')) {
      detectedMode = 'room';
    } else if (
      path.startsWith('/home') ||
      path === '/' ||
      path.startsWith('/item/') ||
      path === '/sell' ||
      path === '/saved' ||
      path === '/delivery' ||
      path === '/checkout'
    ) {
      detectedMode = 'marketplace';
    }

    if (detectedMode) {
      setCurrentMode(detectedMode);
      localStorage.setItem('appMode', detectedMode);
    }
  }, [location.pathname]);

  const handleSetMode = (mode: AppMode) => {
    setCurrentMode(mode);
    localStorage.setItem('appMode', mode);

    // Navigate to the appropriate route
    if (mode === 'gigs') navigate('/gigs');
    else if (mode === 'events') navigate('/events');
    else if (mode === 'news') navigate('/news');
    else if (mode === 'study') navigate('/study');
    else if (mode === 'lost') navigate('/lost-and-found');
    else if (mode === 'room') navigate('/roommates');
    else navigate('/home');
  };

  const value = {
    currentMode,
    setCurrentMode: handleSetMode,
    isMarketplace: currentMode === 'marketplace',
    isGigs: currentMode === 'gigs',
    isEvents: currentMode === 'events',
    isNews: currentMode === 'news',
    isStudy: currentMode === 'study',
    isLost: currentMode === 'lost',
    isRoom: currentMode === 'room'
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