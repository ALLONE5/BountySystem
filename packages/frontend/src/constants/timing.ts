/**
 * 时间相关常量
 * 统一管理项目中的延迟时间、超时时间等
 */

export const TIMING = {
  // 防抖延迟
  DEBOUNCE_DELAY: 300,
  DEBOUNCE_SEARCH: 500,
  
  // 动画延迟
  ANIMATION_DELAY: 200,
  ANIMATION_SHORT: 100,
  ANIMATION_LONG: 500,
  
  // 超时时间
  TIMEOUT_SHORT: 2000,
  TIMEOUT_MEDIUM: 5000,
  TIMEOUT_LONG: 10000,
  
  // 固定列修复延迟
  FIXED_COLUMN_FIX_DELAY: 100,
  FIXED_COLUMN_FIX_QUICK: 50,
  FIXED_COLUMN_FIX_IMMEDIATE: 10,
  
  // 轮询间隔
  POLLING_INTERVAL: 30000,
  POLLING_FAST: 5000,
  
  // 重试延迟
  RETRY_DELAY: 1000,
  RETRY_BACKOFF: 2000,
} as const;

export type TimingKey = keyof typeof TIMING;
