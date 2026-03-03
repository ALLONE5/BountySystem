/**
 * Ant Design 主题配置
 */
import { ThemeConfig } from 'antd';
import { borderRadius, shadows } from '../styles/design-tokens';
import { ThemeMode } from '../styles/themes';

/**
 * 根据主题模式获取Ant Design主题配置
 */
export const getThemeConfig = (themeMode: ThemeMode): ThemeConfig => {
  // 根据主题模式选择颜色
  const themeColors = getThemeColors(themeMode);

  return {
    token: {
      colorPrimary: themeColors.primary,
      colorSuccess: themeColors.success,
      colorWarning: themeColors.warning,
      colorError: themeColors.error,
      colorInfo: themeColors.info,
      colorTextBase: themeColors.textPrimary,
      colorBgBase: themeColors.bgPrimary,
      colorBgContainer: themeColors.bgSecondary,
      colorBgElevated: themeColors.bgTertiary,
      colorBorder: themeColors.borderPrimary,
      colorBgLayout: themeColors.bgPrimary,
      borderRadius: borderRadius.md,
      boxShadow: shadows.sm,
      fontFamily: themeMode === 'cyberpunk' 
        ? '"JetBrains Mono", "Courier New", monospace'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    components: {
      Button: {
        borderRadius: borderRadius.sm,
        controlHeight: 32,
        controlHeightLG: 40,
        primaryColor: themeColors.primary,
        colorPrimaryBorder: themeColors.borderPrimary,
      },
      Card: {
        borderRadius: borderRadius.md,
        boxShadow: shadows.sm,
        colorBgContainer: themeColors.bgSecondary,
        colorBorder: themeColors.borderSecondary,
      },
      Modal: {
        borderRadius: borderRadius.lg,
        colorBgElevated: themeColors.bgTertiary,
        colorBorder: themeColors.borderPrimary,
      },
      Input: {
        borderRadius: borderRadius.sm,
        controlHeight: 32,
        controlHeightLG: 40,
        colorBgContainer: themeColors.bgTertiary,
        colorBorder: themeColors.borderSecondary,
        colorText: themeColors.textPrimary,
        colorTextPlaceholder: themeColors.textTertiary,
      },
      Table: {
        borderRadius: borderRadius.md,
        colorBgContainer: themeColors.bgSecondary,
        colorBorder: themeColors.borderSecondary,
        colorText: themeColors.textPrimary,
        colorTextSecondary: themeColors.textSecondary,
        headerBg: themeColors.bgTertiary,
        headerColor: themeColors.textPrimary,
        rowHoverBg: themeColors.bgTertiary,
      },
      Menu: {
        itemBorderRadius: borderRadius.sm,
        colorBgContainer: themeColors.bgSecondary,
        colorItemBg: themeColors.bgSecondary,
        colorItemBgHover: themeColors.bgTertiary,
        colorItemBgSelected: themeColors.bgTertiary,
        colorItemBgSelectedHorizontal: themeColors.bgTertiary,
        colorItemText: themeColors.textPrimary,
        colorItemTextHover: themeColors.primary,
        colorItemTextSelected: themeColors.primary,
        colorItemTextSelectedHorizontal: themeColors.primary,
      },
      Select: {
        colorBgContainer: themeColors.bgTertiary,
        colorBorder: themeColors.borderSecondary,
        colorText: themeColors.textPrimary,
        colorTextPlaceholder: themeColors.textTertiary,
      },
      Form: {
        labelColor: themeColors.textPrimary,
      },
      Pagination: {
        colorBgContainer: themeColors.bgSecondary,
        colorBorder: themeColors.borderSecondary,
        colorText: themeColors.textPrimary,
      },
      Tabs: {
        colorBgContainer: themeColors.bgSecondary,
        colorBorder: themeColors.borderSecondary,
        colorText: themeColors.textPrimary,
        colorTextHeading: themeColors.textPrimary,
      },
    },
  };
};

/**
 * 获取主题颜色
 */
const getThemeColors = (themeMode: ThemeMode) => {
  switch (themeMode) {
    case 'dark':
      return {
        primary: '#00d9ff',
        success: '#39ff14',
        warning: '#ffa500',
        error: '#ff0040',
        info: '#00d9ff',
        textPrimary: '#e8e8f0',
        textSecondary: '#00d9ff',
        textTertiary: '#ff006e',
        bgPrimary: '#0d0d12',
        bgSecondary: '#1a1a24',
        bgTertiary: '#252533',
        borderPrimary: 'rgba(0, 217, 255, 0.4)',
        borderSecondary: 'rgba(255, 0, 110, 0.2)',
      };
    case 'cyberpunk':
      return {
        primary: '#00f2ff',
        success: '#39ff14',
        warning: '#ffaa00',
        error: '#ff0040',
        info: '#00f2ff',
        textPrimary: '#f0f0f8',
        textSecondary: '#00f2ff',
        textTertiary: '#ff00e5',
        bgPrimary: '#0a0a0f',
        bgSecondary: '#151520',
        bgTertiary: '#1f1f2e',
        borderPrimary: 'rgba(0, 242, 255, 0.5)',
        borderSecondary: 'rgba(255, 0, 229, 0.3)',
      };
    case 'light':
    default:
      return {
        primary: '#0ea5e9',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textTertiary: '#64748b',
        bgPrimary: '#ffffff',
        bgSecondary: '#f8fafc',
        bgTertiary: '#f1f5f9',
        borderPrimary: 'rgba(14, 165, 233, 0.2)',
        borderSecondary: 'rgba(71, 85, 105, 0.2)',
      };
  }
};

// 默认导出浅色主题配置
export const theme: ThemeConfig = getThemeConfig('light');
