
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
    // Default to 'dark' if no theme is saved
    return (saved as Theme) || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('gsu-theme', theme);
    
    // Remove existing themes
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    // Apply theme class to html element
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Apply CSS variables directly to :root
    if (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      // Light mode colors - using HSL values for Tailwind compatibility
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '240 10% 3.9%'); // Near black text
      document.documentElement.style.setProperty('--card', '0 0% 100%');
      document.documentElement.style.setProperty('--card-foreground', '240 10% 3.9%');
      document.documentElement.style.setProperty('--primary', '217.2 91.2% 59.8%'); 
      document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--secondary', '210 40% 96.1%');
      document.documentElement.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--muted', '210 40% 96.1%');
      document.documentElement.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
      document.documentElement.style.setProperty('--accent', '210 40% 96.1%');
      document.documentElement.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--destructive', '0 84.2% 60.2%');
      document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--border', '214.3 31.8% 91.4%');
      document.documentElement.style.setProperty('--input', '214.3 31.8% 91.4%');
      document.documentElement.style.setProperty('--ring', '222.2 84% 4.9%');
    } else {
      // Dark mode colors - using HSL values for Tailwind compatibility - DARKER GRAYS
      document.documentElement.style.setProperty('--background', '240 10% 2.9%'); // Darker background
      document.documentElement.style.setProperty('--foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--card', '240 10% 3.5%'); // Darker card
      document.documentElement.style.setProperty('--card-foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--primary', '217.2 91.2% 59.8%');
      document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--secondary', '240 3.7% 12%'); // Darker secondary
      document.documentElement.style.setProperty('--secondary-foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--muted', '240 3.7% 12%'); // Darker muted
      document.documentElement.style.setProperty('--muted-foreground', '240 5% 64.9%');
      document.documentElement.style.setProperty('--accent', '240 3.7% 12%'); // Darker accent
      document.documentElement.style.setProperty('--accent-foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--destructive', '0 62.8% 30.6%');
      document.documentElement.style.setProperty('--destructive-foreground', '0 0% 98%');
      document.documentElement.style.setProperty('--border', '240 3.7% 12%'); // Darker border
      document.documentElement.style.setProperty('--input', '240 3.7% 12%'); // Darker input
      document.documentElement.style.setProperty('--ring', '240 4.9% 83.9%');
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
        
        // Apply CSS variables based on system theme change
        if (systemTheme === 'light') {
          // Light mode colors - using HSL values for Tailwind compatibility
          document.documentElement.style.setProperty('--background', '0 0% 100%');
          document.documentElement.style.setProperty('--foreground', '240 10% 3.9%'); // Near black text
          document.documentElement.style.setProperty('--card', '0 0% 100%');
          document.documentElement.style.setProperty('--card-foreground', '240 10% 3.9%');
          document.documentElement.style.setProperty('--primary', '217.2 91.2% 59.8%');
          document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
          document.documentElement.style.setProperty('--secondary', '210 40% 96.1%');
          document.documentElement.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
          document.documentElement.style.setProperty('--muted', '210 40% 96.1%');
          document.documentElement.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
          document.documentElement.style.setProperty('--accent', '210 40% 96.1%');
          document.documentElement.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
          document.documentElement.style.setProperty('--destructive', '0 84.2% 60.2%');
          document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
          document.documentElement.style.setProperty('--border', '214.3 31.8% 91.4%');
          document.documentElement.style.setProperty('--input', '214.3 31.8% 91.4%');
          document.documentElement.style.setProperty('--ring', '222.2 84% 4.9%');
        } else {
          // Dark mode colors - using HSL values for Tailwind compatibility - DARKER GRAYS
          document.documentElement.style.setProperty('--background', '240 10% 2.9%'); // Darker background
          document.documentElement.style.setProperty('--foreground', '0 0% 98%');
          document.documentElement.style.setProperty('--card', '240 10% 3.5%'); // Darker card
          document.documentElement.style.setProperty('--card-foreground', '0 0% 98%');
          document.documentElement.style.setProperty('--primary', '217.2 91.2% 59.8%');
          document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
          document.documentElement.style.setProperty('--secondary', '240 3.7% 12%'); // Darker secondary
          document.documentElement.style.setProperty('--secondary-foreground', '0 0% 98%');
          document.documentElement.style.setProperty('--muted', '240 3.7% 12%'); // Darker muted
          document.documentElement.style.setProperty('--muted-foreground', '240 5% 64.9%');
          document.documentElement.style.setProperty('--accent', '240 3.7% 12%'); // Darker accent
          document.documentElement.style.setProperty('--accent-foreground', '0 0% 98%');
          document.documentElement.style.setProperty('--destructive', '0 62.8% 30.6%');
          document.documentElement.style.setProperty('--destructive-foreground', '0 0% 98%');
          document.documentElement.style.setProperty('--border', '240 3.7% 12%'); // Darker border
          document.documentElement.style.setProperty('--input', '240 3.7% 12%'); // Darker input
          document.documentElement.style.setProperty('--ring', '240 4.9% 83.9%');
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
