// Design Tokens and Theme Configuration
export type ThemeMode = 'light' | 'dark';
export type AnimationStyle = 'none' | 'minimal' | 'scanline';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGlass: string;
  bgElevated: string;
  
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  accent: string;
  
  // Functional colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textMuted: string;
  
  // Border and divider colors
  borderPrimary: string;
  borderSecondary: string;
  borderLight: string;
  divider: string;
  
  // Interactive colors
  hover: string;
  active: string;
  focus: string;
  
  // Gradient colors
  gradientPrimary: string;
  gradientSecondary: string;
  gradientAccent: string;
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
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    glow: string;
  };
}

// Light Theme - 更加生动的亮色主题
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // 背景色 - 纯净白色系
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgGlass: 'rgba(255, 255, 255, 0.8)',
    bgElevated: '#ffffff',
    
    // 主色调 - 更加鲜艳的蓝色系
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryActive: '#1e40af',
    secondary: '#7c3aed',
    accent: '#06b6d4',
    
    // 功能色彩 - 更加鲜明
    success: '#059669',
    successLight: '#d1fae5',
    warning: '#d97706',
    warningLight: '#fef3c7',
    danger: '#dc2626',
    dangerLight: '#fee2e2',
    info: '#0284c7',
    infoLight: '#cffafe',
    
    // 文字颜色
    textPrimary: '#111827',
    textSecondary: '#374151',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    textMuted: '#d1d5db',
    
    // 边框颜色
    borderPrimary: '#e5e7eb',
    borderSecondary: '#f3f4f6',
    borderLight: '#f9fafb',
    divider: '#e5e7eb',
    
    // 交互色彩
    hover: 'rgba(37, 99, 235, 0.05)',
    active: 'rgba(37, 99, 235, 0.1)',
    focus: 'rgba(37, 99, 235, 0.2)',
    
    // 渐变色 - 更加鲜艳
    gradientPrimary: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    gradientSecondary: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    gradientAccent: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
  },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", monospace',
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
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
};

// Dark Theme - 更加生动的暗色主题
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // 背景色 - 深邃灰色系
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    bgGlass: 'rgba(30, 41, 59, 0.8)',
    bgElevated: '#1e293b',
    
    // 主色调 - 更加鲜艳的蓝色系
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    primaryActive: '#2563eb',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    
    // 功能色彩 - 更加鲜明
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    danger: '#ef4444',
    dangerLight: 'rgba(239, 68, 68, 0.1)',
    info: '#06b6d4',
    infoLight: 'rgba(6, 182, 212, 0.1)',
    
    // 文字颜色
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    textInverse: '#0f172a',
    textMuted: '#475569',
    
    // 边框颜色
    borderPrimary: '#334155',
    borderSecondary: '#475569',
    borderLight: '#64748b',
    divider: 'rgba(51, 65, 85, 0.6)',
    
    // 交互色彩
    hover: 'rgba(59, 130, 246, 0.1)',
    active: 'rgba(59, 130, 246, 0.2)',
    focus: 'rgba(59, 130, 246, 0.3)',
    
    // 渐变色 - 更加鲜艳
    gradientPrimary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    gradientSecondary: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)',
    gradientAccent: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
  },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", monospace',
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
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
    glow: '0 0 0 3px rgba(96, 165, 250, 0.2)',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};