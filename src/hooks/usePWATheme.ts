
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const usePWATheme = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const updateThemeColor = () => {
      // Get the actual computed colors from CSS variables
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      let themeColor: string;
      
      // Determine the effective theme
      const effectiveTheme = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

      if (effectiveTheme === 'dark') {
        // Use the dark mode background color
        themeColor = '#050505'; // Very dark background for dark mode
      } else {
        // Use the light mode background color
        themeColor = '#ffffff'; // White background for light mode
      }

      // Update or create the theme-color meta tag
      let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }
      
      themeColorMeta.content = themeColor;

      // Also update any manifest theme color if it exists
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        // For better PWA support, we should also handle manifest updates
        // but for now, the meta tag should handle most cases
      }
    };

    // Update theme color immediately
    updateThemeColor();

    // Listen for system theme changes when theme is set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        updateThemeColor();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);
};
