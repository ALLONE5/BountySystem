import React from 'react';
import { Form, Typography, Input } from 'antd';
import { Task } from '../../types';
import { BaseFormModal } from '../common/BaseFormModal';

const { TextArea } = Input;

interface RejectTaskModalProps {
  visible: boolean;
  task: Task | null;
  loading: boolean;
  onSubmit: (values: { reason: string }) => void;
  onCancel: () => void;
}

export const RejectTaskModal: React.FC<RejectTaskModalProps> = ({
  visible,
  task,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: { reason: string }) => {
    onSubmit(values);
  };

  return (
    <BaseFormModal
      visible={visible}
      title="拒绝任务指派"
      form={form}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      okText="确认拒绝"
      cancelText="取消"
      loading={loading}
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text>您确定要拒绝任务 "{task?.name}" 吗？</Typography.Text>
      </div>
      
      <Form.Item
        name="reason"
        label="拒绝原因（可选）"
        help="这将发送给任务发布者"
      >
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          maxLength={500}
          showCount
        />
      </Form.Item>
    </BaseFormModal>
  );
};