import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, Theme, themes } from '../styles/themes';
import { useSystemConfig } from './SystemConfigContext';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  allowThemeSwitch: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { config } = useSystemConfig();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [allowThemeSwitch, setAllowThemeSwitch] = useState(true);

  // Initialize theme from system config and user preferences
  useEffect(() => {
    if (config) {
      setAllowThemeSwitch(config.allowThemeSwitch ?? true);

      // Priority: user localStorage > system config defaultTheme > OS preference
      const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeModeState(savedTheme);
      } else if (config.defaultTheme === 'light' || config.defaultTheme === 'dark') {
        setThemeModeState(config.defaultTheme);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeModeState(prefersDark ? 'dark' : 'light');
      }
    }
  }, [config]);

  // Listen for OS-level color scheme changes (only when user has no saved preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setThemeModeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const theme = themes[themeMode];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    root.setAttribute('data-theme', themeMode);
    document.body.className = `theme-${themeMode}`;
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    if (!allowThemeSwitch) return;
    setThemeModeState(mode);
    localStorage.setItem('theme', mode);
  };

  // toggleTheme delegates to setThemeMode to avoid duplicated logic
  const toggleTheme = () => setThemeMode(themeMode === 'light' ? 'dark' : 'light');

  const value: ThemeContextType = {
    theme: themes[themeMode],
    themeMode,
    allowThemeSwitch,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
