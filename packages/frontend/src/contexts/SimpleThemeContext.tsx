import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'cyberpunk';

interface SimpleThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

export const SimpleThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // 从localStorage获取保存的主题
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'cyberpunk'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新body的class来应用主题
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${newTheme}`);
  };

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'cyberpunk'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // 初始化时应用主题
  useEffect(() => {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const value: SimpleThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <SimpleThemeContext.Provider value={value}>
      {children}
    </SimpleThemeContext.Provider>
  );
};

export const useSimpleTheme = () => {
  const context = useContext(SimpleThemeContext);
  if (context === undefined) {
    throw new Error('useSimpleTheme must be used within a SimpleThemeProvider');
  }
  return context;
};