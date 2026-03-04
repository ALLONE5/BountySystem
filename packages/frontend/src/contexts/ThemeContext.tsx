import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, AnimationStyle, Theme, themes } from '../styles/themes';
import { useSystemConfig } from './SystemConfigContext';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  animationStyle: AnimationStyle;
  enableAnimations: boolean;
  reducedMotion: boolean;
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
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('minimal');
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [allowThemeSwitch, setAllowThemeSwitch] = useState(true);

  // Initialize theme from system config and user preferences
  useEffect(() => {
    if (config) {
      // Set system defaults
      setAnimationStyle(config.animationStyle || 'minimal');
      setEnableAnimations(config.enableAnimations ?? true);
      setReducedMotion(config.reducedMotion ?? false);
      setAllowThemeSwitch(config.allowThemeSwitch ?? true);

      // Get user preference or detect system preference
      const savedTheme = localStorage.getItem('theme') as ThemeMode;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeModeState(savedTheme);
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        setThemeModeState(initialTheme);
        localStorage.setItem('theme', initialTheme);
      }
    }
  }, [config]);

  // Listen for system theme changes
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

  // Listen for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const theme = themes[themeMode];
    const root = document.documentElement;
    
    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--color-${cssKey}`, value);
    });

    // Set additional theme properties
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

    // Set theme mode attribute
    root.setAttribute('data-theme', themeMode);
    
    // Set theme class for body
    document.body.className = `theme-${themeMode}`;
  }, [themeMode]);

  const toggleTheme = () => {
    if (!allowThemeSwitch) return;
    
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setThemeMode = (mode: ThemeMode) => {
    if (!allowThemeSwitch) return;
    
    setThemeModeState(mode);
    localStorage.setItem('theme', mode);
  };

  const value: ThemeContextType = {
    theme: themes[themeMode],
    themeMode,
    animationStyle,
    enableAnimations,
    reducedMotion,
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