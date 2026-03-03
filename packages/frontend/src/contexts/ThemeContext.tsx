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
  const [themeMode, setThemeModeState] = useState<ThemeMode>('cyberpunk');
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('cyberpunk');
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [allowThemeSwitch, setAllowThemeSwitch] = useState(true);

  // Initialize theme from system config and user preferences
  useEffect(() => {
    if (config) {
      // Set system defaults
      setAnimationStyle(config.animationStyle || 'cyberpunk');
      setEnableAnimations(config.enableAnimations ?? true);
      setReducedMotion(config.reducedMotion ?? false);
      setAllowThemeSwitch(config.allowThemeSwitch ?? true);

      // Get user preference or use cyberpunk as default
      const savedTheme = localStorage.getItem('theme') as ThemeMode;
      const initialTheme = savedTheme || 'cyberpunk'; // Force cyberpunk as default
      
      setThemeModeState(initialTheme);
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
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });

    // Set theme mode attribute
    root.setAttribute('data-theme', themeMode);
    
    // Set theme class for Ant Design
    if (themeMode === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
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