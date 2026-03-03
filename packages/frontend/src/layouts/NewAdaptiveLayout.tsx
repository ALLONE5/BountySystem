import React from 'react';
import { BottomNavLayout } from './BottomNavLayout';

/**
 * NewAdaptiveLayout - Production version
 * 所有页面都使用 BottomNavLayout (底部导航)
 * 确保管理员和普通用户界面一致性
 */
export const NewAdaptiveLayout: React.FC = () => {
  console.log('🔄 AdaptiveLayout: Using BottomNavLayout for all pages');

  // 所有页面都使用底部导航布局，确保界面一致性
  return <BottomNavLayout />;
};