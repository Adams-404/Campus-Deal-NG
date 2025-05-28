
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const usePWATheme = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const updateThemeColor = () => {
      // Get the theme-color meta tag
      let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      
      // Create the meta tag if it doesn't exist
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }

      // Determine the actual theme (resolve 'system' to 'light' or 'dark')
      let actualTheme = theme;
      if (theme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // Set the theme color based on the current theme
      if (actualTheme === 'dark') {
        // Use a very dark color for dark mode that matches your app's dark background
        themeColorMeta.content = '#050505'; // Very dark background matching your dark theme
      } else {
        // Use white for light mode
        themeColorMeta.content = '#ffffff';
      }
    };

    // Update theme color immediately
    updateThemeColor();

    // Listen for system theme changes when using 'system' theme
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
