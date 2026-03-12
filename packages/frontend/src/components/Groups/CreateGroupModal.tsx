import React from 'react';
import { Form, Input } from 'antd';
import { BaseFormModal } from '../common';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface CreateGroupModalProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string }) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const { handleAsyncError } = useErrorHandler();

  const handleSubmit = async (values: { name: string }) => {
    await handleAsyncError(
      () => onSubmit(values),
      'CreateGroupModal.submit',
      'Group created successfully',
      'Failed to create group'
    );
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      title="创建组群"
      form={form}
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={onClose}
      okText="创建组群"
    >
      <Form.Item
        name="name"
        label="组群名称"
        rules={[{ required: true, message: '请输入组群名称' }]}
      >
        <Input placeholder="请输入组群名称" />
      </Form.Item>
    </BaseFormModal>
  );
};
