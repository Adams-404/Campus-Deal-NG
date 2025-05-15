
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
      // Light mode colors
      root.style.setProperty('--background', '#FFFFFF');
      root.style.setProperty('--foreground', '#000000');
      root.style.setProperty('--card', '#FFFFFF');
      root.style.setProperty('--card-foreground', '#000000');
      root.style.setProperty('--primary', '#8B5CF6');
      root.style.setProperty('--primary-foreground', '#FFFFFF');
      root.style.setProperty('--secondary', '#F1F1F1');
      root.style.setProperty('--secondary-foreground', '#111111');
      root.style.setProperty('--muted', '#F1F1F1');
      root.style.setProperty('--muted-foreground', '#6B7280');
      root.style.setProperty('--accent', '#F9FAFB');
      root.style.setProperty('--accent-foreground', '#111111');
      root.style.setProperty('--destructive', '#FF0000');
      root.style.setProperty('--destructive-foreground', '#FFFFFF');
      root.style.setProperty('--border', '#E5E7EB');
      root.style.setProperty('--input', '#E5E7EB');
      root.style.setProperty('--ring', '#8B5CF6');
    } else {
      // Dark mode colors
      root.style.setProperty('--background', '#0A0A0A');
      root.style.setProperty('--foreground', '#FFFFFF');
      root.style.setProperty('--card', '#111111');
      root.style.setProperty('--card-foreground', '#FFFFFF');
      root.style.setProperty('--primary', '#8B5CF6');
      root.style.setProperty('--primary-foreground', '#FFFFFF');
      root.style.setProperty('--secondary', '#111111');
      root.style.setProperty('--secondary-foreground', '#FFFFFF');
      root.style.setProperty('--muted', '#1F2937');
      root.style.setProperty('--muted-foreground', '#9CA3AF');
      root.style.setProperty('--accent', '#1F2937');
      root.style.setProperty('--accent-foreground', '#FFFFFF');
      root.style.setProperty('--destructive', '#FF0000');
      root.style.setProperty('--destructive-foreground', '#FFFFFF');
      root.style.setProperty('--border', '#333333');
      root.style.setProperty('--input', '#333333');
      root.style.setProperty('--ring', '#8B5CF6');
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
          // Light mode colors
          document.documentElement.style.setProperty('--background', '#FFFFFF');
          document.documentElement.style.setProperty('--foreground', '#000000');
          document.documentElement.style.setProperty('--card', '#FFFFFF');
          document.documentElement.style.setProperty('--card-foreground', '#000000');
          document.documentElement.style.setProperty('--primary', '#8B5CF6');
          document.documentElement.style.setProperty('--primary-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--secondary', '#F1F1F1');
          document.documentElement.style.setProperty('--secondary-foreground', '#111111');
          document.documentElement.style.setProperty('--muted', '#F1F1F1');
          document.documentElement.style.setProperty('--muted-foreground', '#6B7280');
          document.documentElement.style.setProperty('--accent', '#F9FAFB');
          document.documentElement.style.setProperty('--accent-foreground', '#111111');
          document.documentElement.style.setProperty('--destructive', '#FF0000');
          document.documentElement.style.setProperty('--destructive-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--border', '#E5E7EB');
          document.documentElement.style.setProperty('--input', '#E5E7EB');
          document.documentElement.style.setProperty('--ring', '#8B5CF6');
        } else {
          // Dark mode colors
          document.documentElement.style.setProperty('--background', '#0A0A0A');
          document.documentElement.style.setProperty('--foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--card', '#111111');
          document.documentElement.style.setProperty('--card-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--primary', '#8B5CF6');
          document.documentElement.style.setProperty('--primary-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--secondary', '#111111');
          document.documentElement.style.setProperty('--secondary-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--muted', '#1F2937');
          document.documentElement.style.setProperty('--muted-foreground', '#9CA3AF');
          document.documentElement.style.setProperty('--accent', '#1F2937');
          document.documentElement.style.setProperty('--accent-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--destructive', '#FF0000');
          document.documentElement.style.setProperty('--destructive-foreground', '#FFFFFF');
          document.documentElement.style.setProperty('--border', '#333333');
          document.documentElement.style.setProperty('--input', '#333333');
          document.documentElement.style.setProperty('--ring', '#8B5CF6');
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
