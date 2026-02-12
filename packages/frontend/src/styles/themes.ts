// Design Tokens and Theme Configuration
export type ThemeMode = 'light' | 'dark';
export type AnimationStyle = 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGlass: string;
  
  // Primary colors
  primary: string;
  secondary: string;
  accent: string;
  
  // Functional colors
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border and divider colors
  borderPrimary: string;
  borderSecondary: string;
  divider: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
}

// Dark Theme - "夜行猎人"
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    bgPrimary: '#0a0b10',
    bgSecondary: '#161821',
    bgTertiary: '#1f2937',
    bgGlass: 'rgba(22, 24, 33, 0.8)',
    
    primary: '#00f2ff',
    secondary: '#FDE047',
    accent: '#8b5cf6',
    
    success: '#10b981',
    warning: '#facc15',
    danger: '#ef4444',
    info: '#3b82f6',
    
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    textInverse: '#0f172a',
    
    borderPrimary: 'rgba(0, 242, 255, 0.2)',
    borderSecondary: 'rgba(148, 163, 184, 0.1)',
    divider: 'rgba(148, 163, 184, 0.1)',
  },
  fonts: {
    display: '"Orbitron", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    glow: '0 0 20px rgba(0, 242, 255, 0.3)',
  },
};

// Light Theme - "日光战士"
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgGlass: 'rgba(248, 250, 252, 0.9)',
    
    primary: '#0ea5e9',
    secondary: '#f59e0b',
    accent: '#8b5cf6',
    
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
    
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#64748b',
    textInverse: '#ffffff',
    
    borderPrimary: 'rgba(14, 165, 233, 0.2)',
    borderSecondary: 'rgba(71, 85, 105, 0.2)',
    divider: 'rgba(71, 85, 105, 0.1)',
  },
  fonts: {
    display: '"Orbitron", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    glow: '0 0 20px rgba(14, 165, 233, 0.3)',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};