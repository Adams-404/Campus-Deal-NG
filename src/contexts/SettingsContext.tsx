import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  fontSizeClass: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('gsu-font-size');
    return (saved as 'small' | 'medium' | 'large') || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('gsu-font-size', fontSize);
  }, [fontSize]);

  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[fontSize];

  return (
    <SettingsContext.Provider value={{ fontSize, setFontSize, fontSizeClass }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 