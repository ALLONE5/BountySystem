import React from 'react';
import { Modal, Form, Input, Button } from 'antd';
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await handleAsyncError(
        () => onSubmit(values),
        'CreateGroupModal.submit',
        'Group created successfully',
        'Failed to create group'
      );
      form.resetFields();
      onClose();
    } catch (error) {
      // 表单验证失败，不需要处理
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="创建组群"
      open={visible}
      onCancel={handleCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="组群名称"
          rules={[{ required: true, message: '请输入组群名称' }]}
        >
          <Input placeholder="请输入组群名称" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
          >
            创建组群
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};