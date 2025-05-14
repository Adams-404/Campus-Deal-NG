
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('gsu-theme');
    return (saved as Theme) || 'system';
  });

  useEffect(() => {
    localStorage.setItem('gsu-theme', theme);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Update CSS variables based on theme
    if (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.style.setProperty('--background', '#FFFFFF');
      root.style.setProperty('--foreground', '#000000');
      root.style.setProperty('--card', '#FFFFFF');
      root.style.setProperty('--card-foreground', '#000000');
      root.style.setProperty('--secondary', '#F1F1F1');
      root.style.setProperty('--secondary-foreground', '#111111');
    } else {
      root.style.setProperty('--background', '#0A0A0A');
      root.style.setProperty('--foreground', '#FFFFFF');
      root.style.setProperty('--card', '#111111');
      root.style.setProperty('--card-foreground', '#FFFFFF');
      root.style.setProperty('--secondary', '#111111');
      root.style.setProperty('--secondary-foreground', '#FFFFFF');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(systemTheme);
        
        // Update CSS variables based on system theme change
        if (systemTheme === 'light') {
          document.documentElement.style.setProperty('--background', '#FFFFFF');
          document.documentElement.style.setProperty('--foreground', '#000000');
          document.documentElement.style.setProperty('--card', '#FFFFFF');
          document.documentElement.style.setProperty('--card-foreground', '#000000');
          document.documentElement.style.setProperty('--secondary', '#F1F1F1');
          document.documentElement.style.setProperty('--secondary-foreground', '#111111');
        } else {
          document.documentElement.style.setProperty('--background', '#0A0A0A');
          document.documentElement.style.setProperty('--foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--card', '#111111');
          document.documentElement.style.setProperty('--card-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--secondary', '#111111');
          document.documentElement.style.setProperty('--secondary-foreground', '#FFFFFF');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
