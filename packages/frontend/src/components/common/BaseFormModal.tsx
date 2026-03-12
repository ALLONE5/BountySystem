/**
 * 基础表单模态框组件
 * 集成 Ant Design Form，提供统一的表单模态框
 */

import React from 'react';
import { Modal, Form, Button, Space } from 'antd';
import type { FormInstance, FormProps } from 'antd';

export interface BaseFormModalProps<T = any> {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title: string;
  /** 子内容（表单项） */
  children: React.ReactNode;
  /** Form 实例 */
  form: FormInstance<T>;
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 提交加载状态 */
  loading?: boolean;
  /** 提交回调 */
  onSubmit: (values: T) => void | Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
  /** 模态框宽度 */
  width?: number | string;
  /** Form 布局 */
  layout?: FormProps['layout'];
  /** Label 列宽度 */
  labelCol?: FormProps['labelCol'];
  /** Wrapper 列宽度 */
  wrapperCol?: FormProps['wrapperCol'];
}

/**
 * 基础表单模态框组件
 * 
 * @example
 * ```tsx
 * const [form] = Form.useForm();
 * 
 * <BaseFormModal
 *   visible={visible}
 *   title="创建任务"
 *   form={form}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   loading={loading}
 * >
 *   <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
 *     <Input />
 *   </Form.Item>
 * </BaseFormModal>
 * ```
 */
export const BaseFormModal = <T extends Record<string, any> = any>({
  visible,
  title,
  children,
  form,
  okText = '确定',
  cancelText = '取消',
  loading = false,
  onSubmit,
  onCancel,
  width = 600,
  layout = 'vertical',
  labelCol,
  wrapperCol,
}: BaseFormModalProps<T>) => {
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      // 表单验证失败，不做处理
      console.debug('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      form.resetFields();
      onCancel();
    }
  };

  const handleAfterClose = () => {
    form.resetFields();
  };

  const footer = (
    <Space>
      <Button onClick={handleCancel} disabled={loading}>
        {cancelText}
      </Button>
      <Button type="primary" onClick={handleOk} loading={loading}>
        {okText}
      </Button>
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
      maskClosable={false}
      closable={!loading}
      keyboard={!loading}
      afterClose={handleAfterClose}
      destroyOnClose
    >
      <Form
        form={form}
        layout={layout}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
      >
        {children}
      </Form>
    </Modal>
  );
};
