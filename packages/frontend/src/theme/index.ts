/**
 * Ant Design 主题配置
 */
import { ThemeConfig } from 'antd';
import { colors, borderRadius, shadows } from '../styles/design-tokens';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    colorTextBase: colors.text.primary,
    colorBorder: colors.border.base,
    colorBgContainer: colors.background.base,
    borderRadius: borderRadius.md,
    boxShadow: shadows.sm,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: borderRadius.sm,
      controlHeight: 32,
      controlHeightLG: 40,
    },
    Card: {
      borderRadius: borderRadius.md,
      boxShadow: shadows.sm,
    },
    Modal: {
      borderRadius: borderRadius.lg,
    },
    Input: {
      borderRadius: borderRadius.sm,
      controlHeight: 32,
      controlHeightLG: 40,
    },
    Table: {
      borderRadius: borderRadius.md,
    },
    Menu: {
      itemBorderRadius: borderRadius.sm,
    },
  },
};
