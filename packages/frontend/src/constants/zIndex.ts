/**
 * Z-Index 层级常量
 * 统一管理项目中的 z-index 值，避免层级冲突
 */

export const Z_INDEX = {
  // 基础层级
  BASE: 1,
  ABOVE_BASE: 10,
  
  // 导航和侧边栏
  NAVIGATION: 100,
  SIDEBAR: 100,
  MOBILE_NAV: 100,
  
  // 遮罩层
  OVERLAY: 999,
  MODAL_OVERLAY: 1000,
  
  // 固定列
  FIXED_COLUMN: 999,
  
  // 下拉菜单和弹出层
  DROPDOWN: 1050,
  POPOVER: 1050,
  TOOLTIP: 1060,
  
  // 模态框
  MODAL: 1061,
  MODAL_CONTENT: 1061,
  
  // 最高层级
  NOTIFICATION: 9999,
  CUSTOM_DROPDOWN: 9999,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
