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

  // Update URL when mode changes
  useEffect(() => {
    const path = location.pathname;

    // Helper to check if we are already on the correct path for the mode
    const isCorrectPath = (mode: AppMode) => {
      if (mode === 'gigs') return path.startsWith('/gigs');
      if (mode === 'events') return path.startsWith('/events');
      if (mode === 'news') return path.startsWith('/news');
      if (mode === 'study') return path.startsWith('/study');
      if (mode === 'lost') return path.startsWith('/lost-and-found');
      if (mode === 'room') return path.startsWith('/roommates');
      if (mode === 'marketplace') return !path.startsWith('/gigs') && !path.startsWith('/events') && !path.startsWith('/news') && !path.startsWith('/study') && !path.startsWith('/lost-and-found') && !path.startsWith('/roommates');
      return false;
    };

    if (!isCorrectPath(currentMode)) {
      if (currentMode === 'gigs') navigate('/gigs');
      else if (currentMode === 'events') navigate('/events');
      else if (currentMode === 'news') navigate('/news');
      else if (currentMode === 'study') navigate('/study');
      else if (currentMode === 'lost') navigate('/lost-and-found');
      else if (currentMode === 'room') navigate('/roommates');
      else navigate('/home');
    }
  }, [currentMode, navigate]);

  const value = {
    currentMode,
    setCurrentMode,
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