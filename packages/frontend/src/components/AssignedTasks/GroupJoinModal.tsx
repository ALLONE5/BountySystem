/**
 * 群组加入模态框组件
 * 用于将任务加入群组或查看已加入的群组
 */

import React, { useState } from 'react';
import { Modal, Space, Select, Button, Form } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { Task } from '../../types';
import { groupApi } from '../../api/group';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { BaseFormModal } from '../common/BaseFormModal';

interface GroupJoinModalProps {
  visible: boolean;
  task: Task | null;
  userGroups: any[];
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const GroupJoinModal: React.FC<GroupJoinModalProps> = ({
  visible,
  task,
  userGroups,
  onClose,
  onTaskUpdated
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  const isViewMode = !!task?.groupId;

  const handleSubmit = async (values: { groupId: string }) => {
    if (!task || !values.groupId) {
      return;
    }

    setLoading(true);
    try {
      await handleAsyncError(
        async () => {
          await groupApi.convertTaskToGroupTask(values.groupId, task.id);
          onClose();
          onTaskUpdated();
        },
        'GroupJoinModal.convertToGroup',
        '任务已加入群组',
        '转换失败'
      );
    } finally {
      setLoading(false);
    }
  };

  // 查看模式使用普通 Modal
  if (isViewMode) {
    return (
      <Modal
        title="任务群组"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" type="primary" onClick={onClose}>
            关闭
          </Button>
        ]}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>此任务已关联到以下群组：</div>
          
          <div style={{ padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  <TeamOutlined /> {task.groupName || '未知群组'}
                </Typography.Text>
              </div>
              {userGroups.find(g => g.id === task.groupId) && (
                <Typography.Text type="secondary">
                  成员数：{userGroups.find(g => g.id === task.groupId)?.members?.length || 0} 人
                </Typography.Text>
              )}
            </Space>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
            <Typography.Text style={{ fontSize: 12, color: '#096dd9' }}>
              <strong>说明：</strong>
              <br />
              • 群组中的所有成员都可以查看此任务
              <br />
              • 您仍然是任务的承接者
              <br />
              • 任务关联的群组不可更改
            </Typography.Text>
          </div>
        </Space>
      </Modal>
    );
  }

  // 编辑模式使用 BaseFormModal
  return (
    <BaseFormModal
      visible={visible}
      title="加入群组"
      form={form}
      onSubmit={handleSubmit}
      onCancel={onClose}
      okText="确认加入"
      cancelText="取消"
      loading={loading}
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text>
          将任务 "{task?.name}" 加入群组后，组群中的所有成员都可以查看和协作此任务。
        </Typography.Text>
      </div>
      
      <Form.Item
        name="groupId"
        label="选择组群"
        rules={[{ required: true, message: '请选择要关联的组群' }]}
      >
        <Select placeholder="请选择要关联的组群">
          {userGroups.map(group => (
            <Select.Option key={group.id} value={group.id}>
              <Space>
                <TeamOutlined />
                <span>{group.name}</span>
                <Typography.Text type="secondary">({group.members?.length || 0} 成员)</Typography.Text>
              </Space>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4, borderLeft: '3px solid #faad14' }}>
        <Typography.Text style={{ fontSize: 12, color: '#d46b08' }}>
          <strong>注意：</strong>
          <br />
          • 加入后，您仍然是任务的承接者
          <br />
          • 组群成员可以查看任务详情和进度
          <br />
          • 此操作不可撤销
        </Typography.Text>
      </div>
    </BaseFormModal>
  );
};