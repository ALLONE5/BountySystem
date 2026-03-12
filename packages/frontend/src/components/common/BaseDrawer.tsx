/**
 * 基础抽屉组件
 * 提供统一的抽屉样式和行为
 */

import React from 'react';
import { Drawer, Button, Space } from 'antd';
import type { DrawerProps } from 'antd';

export interface BaseDrawerProps extends Omit<DrawerProps, 'onClose'> {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title: string;
  /** 子内容 */
  children: React.ReactNode;
  /** 关闭回调 */
  onClose: () => void;
  /** 抽屉宽度 */
  width?: number | string;
  /** 是否显示底部操作栏 */
  showFooter?: boolean;
  /** 底部操作栏内容 */
  footer?: React.ReactNode;
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮加载状态 */
  loading?: boolean;
  /** 是否显示确认按钮 */
  showOkButton?: boolean;
  /** 是否显示取消按钮 */
  showCancelButton?: boolean;
  /** 确认回调 */
  onOk?: () => void | Promise<void>;
  /** 抽屉位置 */
  placement?: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * 基础抽屉组件
 * 
 * @example
 * ```tsx
 * <BaseDrawer
 *   visible={visible}
 *   title="任务详情"
 *   onClose={handleClose}
 *   width={600}
 * >
 *   <div>任务内容</div>
 * </BaseDrawer>
 * ```
 * 
 * @example
 * ```tsx
 * <BaseDrawer
 *   visible={visible}
 *   title="编辑任务"
 *   onClose={handleClose}
 *   onOk={handleSave}
 *   loading={saving}
 *   showFooter
 * >
 *   <Form>...</Form>
 * </BaseDrawer>
 * ```
 */
export const BaseDrawer: React.FC<BaseDrawerProps> = ({
  visible,
  title,
  children,
  onClose,
  width = 600,
  showFooter = false,
  footer,
  okText = '确定',
  cancelText = '取消',
  loading = false,
  showOkButton = true,
  showCancelButton = true,
  onOk,
  placement = 'right',
  ...restProps
}) => {
  const handleOk = async () => {
    if (onOk) {
      await onOk();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const defaultFooter = showFooter ? (
    <Space>
      {showCancelButton && (
        <Button onClick={handleClose} disabled={loading}>
          {cancelText}
        </Button>
      )}
      {showOkButton && (
        <Button type="primary" onClick={handleOk} loading={loading}>
          {okText}
        </Button>
      )}
    </Space>
  ) : undefined;

  return (
    <Drawer
      open={visible}
      title={title}
      onClose={handleClose}
      width={width}
      placement={placement}
      footer={footer !== undefined ? footer : defaultFooter}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
      {...restProps}
    >
      {children}
    </Drawer>
  );
};
