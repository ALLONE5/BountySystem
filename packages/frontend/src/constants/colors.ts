/**
 * 颜色常量
 * 统一管理项目中的颜色值
 */

export const COLORS = {
  // 深色主题背景
  DARK_BG: '#1e293b',
  DARK_BG_DARKER: '#0f172a',
  DARK_BG_LIGHTER: '#334155',
  
  // 浅色主题背景
  LIGHT_BG: '#ffffff',
  LIGHT_BG_GRAY: '#f8fafc',
  LIGHT_BG_DARKER: '#f1f5f9',
  
  // 边框颜色
  BORDER_LIGHT: '#e2e8f0',
  BORDER_DARK: '#334155',
  
  // 文本颜色
  TEXT_PRIMARY: '#1e293b',
  TEXT_SECONDARY: '#64748b',
  TEXT_DISABLED: '#94a3b8',
  TEXT_INVERSE: '#ffffff',
  
  // 状态颜色
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  
  // 品牌颜色
  PRIMARY: '#3b82f6',
  PRIMARY_HOVER: '#2563eb',
  PRIMARY_ACTIVE: '#1d4ed8',
} as const;

export type ColorKey = keyof typeof COLORS;
