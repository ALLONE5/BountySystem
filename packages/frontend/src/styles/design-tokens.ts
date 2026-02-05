/**
 * 设计系统 - Design Tokens
 * 统一的设计变量，确保整个应用的视觉一致性
 */

export const colors = {
  // 主色调
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff',
  
  // 中性色
  text: {
    primary: 'rgba(0, 0, 0, 0.85)',
    secondary: 'rgba(0, 0, 0, 0.65)',
    disabled: 'rgba(0, 0, 0, 0.25)',
    inverse: '#ffffff',
  },
  
  border: {
    base: '#d9d9d9',
    light: '#f0f0f0',
    dark: '#bfbfbf',
  },
  
  background: {
    base: '#ffffff',
    light: '#fafafa',
    dark: '#f5f5f5',
    hover: '#f5f5f5',
  },
  
  // 状态色
  status: {
    notStarted: '#8c8c8c',
    available: '#1890ff',
    inProgress: '#faad14',
    completed: '#52c41a',
    abandoned: '#f5222d',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  round: '50%',
};

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
  xl: '0 12px 32px rgba(0, 0, 0, 0.20)',
};

export const typography = {
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 600,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 600,
  },
  h3: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: 400,
  },
  small: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: 400,
  },
};

export const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};
