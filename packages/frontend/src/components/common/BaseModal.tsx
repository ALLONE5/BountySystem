/**
 * 基础模态框组件
 * 提供统一的模态框样式和行为
 */

import React from 'react';
import { Modal, Button, Space } from 'antd';
import type { ModalProps } from 'antd';

export interface BaseModalProps extends Omit<ModalProps, 'onOk' | 'onCancel'> {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title: string;
  /** 子内容 */
  children: React.ReactNode;
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
  /** 取消回调 */
  onCancel?: () => void;
  /** 模态框宽度 */
  width?: number | string;
  /** 是否可以通过点击遮罩关闭 */
  maskClosable?: boolean;
}

/**
 * 基础模态框组件
 * 
 * @example
 * ```tsx
 * <BaseModal
 *   visible={visible}
 *   title="确认操作"
 *   onOk={handleOk}
 *   onCancel={handleCancel}
 *   loading={loading}
 * >
 *   <p>确定要执行此操作吗？</p>
 * </BaseModal>
 * ```
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  title,
  children,
  okText = '确定',
  cancelText = '取消',
  loading = false,
  showOkButton = true,
  showCancelButton = true,
  onOk,
  onCancel,
  width = 520,
  maskClosable = false,
  ...restProps
}) => {
  const handleOk = async () => {
    if (onOk) {
      await onOk();
    }
  };

  const handleCancel = () => {
    if (!loading && onCancel) {
      onCancel();
    }
  };

  const footer = (
    <Space>
      {showCancelButton && (
        <Button onClick={handleCancel} disabled={loading}>
          {cancelText}
        </Button>
      )}
      {showOkButton && (
        <Button type="primary" onClick={handleOk} loading={loading}>
          {okText}
        </Button>
      )}
    </Space>
  );

  return (
    <Modal
      open={visible}
      title={title}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={footer}
      width={width}
      maskClosable={maskClosable}
      closable={!loading}
      keyboard={!loading}
      {...restProps}
    >
      {children}
    </Modal>
  );
};
