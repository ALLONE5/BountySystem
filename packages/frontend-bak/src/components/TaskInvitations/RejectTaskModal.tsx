import React from 'react';
import { Modal, Space, Typography, Input } from 'antd';
import { Task } from '../../types';

const { TextArea } = Input;

interface RejectTaskModalProps {
  visible: boolean;
  task: Task | null;
  rejectReason: string;
  loading: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RejectTaskModal: React.FC<RejectTaskModalProps> = ({
  visible,
  task,
  rejectReason,
  loading,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      title="拒绝任务指派"
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认拒绝"
      cancelText="取消"
      okButtonProps={{ danger: true, loading }}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Text>您确定要拒绝任务 "{task?.name}" 吗？</Typography.Text>
        
        <div>
          <Typography.Text>拒绝原因（可选）：</Typography.Text>
          <TextArea
            rows={4}
            placeholder="请输入拒绝原因，这将发送给任务发布者"
            value={rejectReason}
            onChange={(e) => onReasonChange(e.target.value)}
            maxLength={500}
            showCount
          />
        </div>
      </Space>
    </Modal>
  );
};