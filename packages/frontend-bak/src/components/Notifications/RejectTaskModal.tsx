import React from 'react';
import { Modal, Space, Typography, Input } from 'antd';

const { TextArea } = Input;

interface RejectTaskModalProps {
  visible: boolean;
  rejectReason: string;
  loading: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RejectTaskModal: React.FC<RejectTaskModalProps> = ({
  visible,
  rejectReason,
  loading,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      title="拒绝任务邀请"
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认拒绝"
      cancelText="取消"
      okButtonProps={{ danger: true, loading }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Text>您确定要拒绝这个任务邀请吗？</Typography.Text>
        
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