// Design Tokens and Theme Configuration
export type ThemeMode = 'light' | 'dark';
export type AnimationStyle = 'none' | 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'cyberpunk' | 'matrix';

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

// Light Theme - 简洁优雅的亮色主题
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // 背景色 - 纯净白色系
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgGlass: 'rgba(255, 255, 255, 0.8)',
    bgElevated: '#ffffff',
    
    // 主色调 - 现代蓝色系
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    
    // 功能色彩
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    info: '#06b6d4',
    infoLight: '#cffafe',
    
    // 文字颜色
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    textMuted: '#d1d5db',
    
    // 边框颜色
    borderPrimary: '#e5e7eb',
    borderSecondary: '#f3f4f6',
    borderLight: '#f9fafb',
    divider: '#e5e7eb',
    
    // 交互色彩
    hover: 'rgba(59, 130, 246, 0.05)',
    active: 'rgba(59, 130, 246, 0.1)',
    focus: 'rgba(59, 130, 246, 0.2)',
    
    // 渐变色
    gradientPrimary: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    gradientSecondary: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    gradientAccent: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
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

// Dark Theme - 优雅深邀的暗色主题
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // 背景色 - 深邃灰色系
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    bgGlass: 'rgba(30, 41, 59, 0.8)',
    bgElevated: '#1e293b',
    
    // 主色调 - 明亮蓝色系
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    primaryActive: '#2563eb',
    secondary: '#818cf8',
    accent: '#a78bfa',
    
    // 功能色彩
    success: '#34d399',
    successLight: 'rgba(52, 211, 153, 0.1)',
    warning: '#fbbf24',
    warningLight: 'rgba(251, 191, 36, 0.1)',
    danger: '#f87171',
    dangerLight: 'rgba(248, 113, 113, 0.1)',
    info: '#22d3ee',
    infoLight: 'rgba(34, 211, 238, 0.1)',
    
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
    hover: 'rgba(96, 165, 250, 0.1)',
    active: 'rgba(96, 165, 250, 0.2)',
    focus: 'rgba(96, 165, 250, 0.3)',
    
    // 渐变色
    gradientPrimary: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
    gradientSecondary: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
    gradientAccent: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
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