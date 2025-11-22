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
  const [currentMode, setCurrentMode] = useState<AppMode>('marketplace');
  const navigate = useNavigate();
  const location = useLocation();

  // Detect mode from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/gigs')) {
      setCurrentMode('gigs');
    } else if (path.startsWith('/events')) {
      setCurrentMode('events');
    } else if (path.startsWith('/news')) {
      setCurrentMode('news');
    } else if (path.startsWith('/study')) {
      setCurrentMode('study');
    } else if (path.startsWith('/lost-and-found')) {
      setCurrentMode('lost');
    } else if (path.startsWith('/roommates')) {
      setCurrentMode('room');
    } else {
      setCurrentMode('marketplace');
    }
  }, [location.pathname]);

  const handleSetMode = (mode: AppMode) => {
    setCurrentMode(mode);

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