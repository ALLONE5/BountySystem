// Design Tokens and Theme Configuration
export type ThemeMode = 'light' | 'dark' | 'cyberpunk' | 'discord' | 'midjourney';
export type AnimationStyle = 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'cyberpunk' | 'matrix';

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

// Dark Theme - "夜行猎人" (Optimized with cyberpunk fusion)
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    bgPrimary: '#0d0d12',
    bgSecondary: '#1a1a24',
    bgTertiary: '#252533',
    bgGlass: 'rgba(26, 26, 36, 0.85)',
    
    primary: '#00d9ff',
    secondary: '#ff006e',
    accent: '#39ff14',
    
    success: '#39ff14',
    warning: '#ffa500',
    danger: '#ff0040',
    info: '#00d9ff',
    
    textPrimary: '#e8e8f0',
    textSecondary: '#00d9ff',
    textTertiary: '#ff006e',
    textInverse: '#0d0d12',
    
    borderPrimary: 'rgba(0, 217, 255, 0.4)',
    borderSecondary: 'rgba(255, 0, 110, 0.2)',
    divider: 'rgba(0, 217, 255, 0.15)',
  },
  fonts: {
    display: '"Orbitron", "JetBrains Mono", monospace',
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
    sm: '0 0 8px rgba(0, 217, 255, 0.2)',
    md: '0 0 16px rgba(0, 217, 255, 0.3), 0 0 8px rgba(255, 0, 110, 0.15)',
    lg: '0 0 24px rgba(0, 217, 255, 0.4), 0 0 16px rgba(255, 0, 110, 0.2)',
    glow: '0 0 20px rgba(0, 217, 255, 0.6), 0 0 40px rgba(255, 0, 110, 0.3)',
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

// Cyberpunk Theme - "赛博朋克" (Enhanced with dark fusion)
export const cyberpunkTheme: Theme = {
  mode: 'cyberpunk',
  colors: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#151520',
    bgTertiary: '#1f1f2e',
    bgGlass: 'rgba(21, 21, 32, 0.9)',
    
    primary: '#00f2ff',
    secondary: '#ff00e5',
    accent: '#39ff14',
    
    success: '#39ff14',
    warning: '#ffaa00',
    danger: '#ff0040',
    info: '#00f2ff',
    
    textPrimary: '#f0f0f8',
    textSecondary: '#00f2ff',
    textTertiary: '#ff00e5',
    textInverse: '#0a0a0f',
    
    borderPrimary: 'rgba(0, 242, 255, 0.5)',
    borderSecondary: 'rgba(255, 0, 229, 0.3)',
    divider: 'rgba(0, 242, 255, 0.15)',
  },
  fonts: {
    display: '"Orbitron", "JetBrains Mono", monospace',
    body: '"JetBrains Mono", "Courier New", monospace',
    mono: '"JetBrains Mono", "Courier New", monospace',
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
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.375rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 0 8px rgba(0, 242, 255, 0.25)',
    md: '0 0 16px rgba(0, 242, 255, 0.35), 0 0 8px rgba(255, 0, 229, 0.15)',
    lg: '0 0 24px rgba(0, 242, 255, 0.45), 0 0 16px rgba(255, 0, 229, 0.25)',
    glow: '0 0 20px rgba(0, 242, 255, 0.7), 0 0 40px rgba(255, 0, 229, 0.35)',
  },
};

// Discord Theme - "Discord 风格"
export const discordTheme: Theme = {
  mode: 'dark',
  colors: {
    bgPrimary: '#2f3136',
    bgSecondary: '#36393f',
    bgTertiary: '#40444b',
    bgGlass: 'rgba(54, 57, 63, 0.9)',
    
    primary: '#5865f2',
    secondary: '#4f545c',
    accent: '#00d9ff',
    
    success: '#57f287',
    warning: '#fee75c',
    danger: '#ed4245',
    info: '#00aff4',
    
    textPrimary: '#dcddde',
    textSecondary: '#b9bbbe',
    textTertiary: '#72767d',
    textInverse: '#ffffff',
    
    borderPrimary: 'rgba(88, 101, 242, 0.3)',
    borderSecondary: 'rgba(64, 68, 75, 0.6)',
    divider: 'rgba(64, 68, 75, 0.48)',
  },
  fonts: {
    display: '"Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"Consolas", "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace',
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
    sm: '3px',
    md: '5px',
    lg: '8px',
    full: '50%',
  },
  shadows: {
    sm: '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)',
    md: '0 4px 4px rgba(0,0,0,0.16)',
    lg: '0 8px 16px rgba(0,0,0,0.24)',
    glow: '0 0 0 1px rgba(88,101,242,0.6), 0 0 0 3px rgba(88,101,242,0.2)',
  },
};

// Midjourney Theme - "Midjourney 风格"
export const midjourneyTheme: Theme = {
  mode: 'light',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8f9fa',
    bgTertiary: '#e9ecef',
    bgGlass: 'rgba(248, 249, 250, 0.95)',
    
    primary: '#000000',
    secondary: '#6c757d',
    accent: '#007bff',
    
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    textTertiary: '#adb5bd',
    textInverse: '#ffffff',
    
    borderPrimary: 'rgba(0, 0, 0, 0.125)',
    borderSecondary: 'rgba(0, 0, 0, 0.0625)',
    divider: 'rgba(0, 0, 0, 0.0625)',
  },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
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
    lg: '1rem',
    full: '50%',
  },
  shadows: {
    sm: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
    md: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
    lg: '0 1rem 3rem rgba(0, 0, 0, 0.175)',
    glow: '0 0 0 0.2rem rgba(0, 123, 255, 0.25)',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  cyberpunk: cyberpunkTheme,
  discord: discordTheme,
  midjourney: midjourneyTheme,
};