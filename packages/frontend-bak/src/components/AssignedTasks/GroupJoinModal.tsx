/**
 * 群组加入模态框组件
 * 用于将任务加入群组或查看已加入的群组
 */

import React, { useState } from 'react';
import { Modal, Space, Select, Button } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { Task } from '../../types';
import { groupApi } from '../../api/group';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { Text } = Typography;

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
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  const handleConfirm = async () => {
    // 如果任务已有群组，只是查看模式，直接关闭
    if (task?.groupId) {
      onClose();
      return;
    }

    // 否则进行群组转换
    if (!task || !selectedGroupId) {
      return;
    }

    setLoading(true);
    await handleAsyncError(
      async () => {
        await groupApi.convertTaskToGroupTask(selectedGroupId, task.id);
        setSelectedGroupId(undefined);
        onClose();
        onTaskUpdated();
      },
      'GroupJoinModal.convertToGroup',
      '任务已加入群组',
      '转换失败'
    ).finally(() => {
      setLoading(false);
    });
  };

  const handleCancel = () => {
    setSelectedGroupId(undefined);
    onClose();
  };

  const isViewMode = !!task?.groupId;

  return (
    <Modal
      title={isViewMode ? "任务群组" : "加入群组"}
      open={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={isViewMode ? "关闭" : "确认加入"}
      cancelText={isViewMode ? null : "取消"}
      confirmLoading={loading}
      footer={isViewMode ? [
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ] : undefined}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        {isViewMode ? (
          // 查看模式：显示当前群组信息
          <>
            <Text>此任务已关联到以下群组：</Text>
            
            <div style={{ padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
              <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    <TeamOutlined /> {task.groupName || '未知群组'}
                  </Text>
                </div>
                {userGroups.find(g => g.id === task.groupId) && (
                  <Text type="secondary">
                    成员数：{userGroups.find(g => g.id === task.groupId)?.members?.length || 0} 人
                  </Text>
                )}
              </Space>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
              <Text style={{ fontSize: 12, color: '#096dd9' }}>
                <strong>说明：</strong>
                <br />
                • 群组中的所有成员都可以查看此任务
                <br />
                • 您仍然是任务的承接者
                <br />
                • 任务关联的群组不可更改
              </Text>
            </div>
          </>
        ) : (
          // 选择模式：允许加入群组
          <>
            <Text>将任务 "{task?.name}" 加入群组后，组群中的所有成员都可以查看和协作此任务。</Text>
            
            <div>
              <Text strong>选择组群：</Text>
              <Select
                placeholder="请选择要关联的组群"
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                style={{ width: '100%', marginTop: 8 }}
              >
                {userGroups.map(group => (
                  <Select.Option key={group.id} value={group.id}>
                    <Space>
                      <TeamOutlined />
                      <span>{group.name}</span>
                      <Text type="secondary">({group.members?.length || 0} 成员)</Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4, borderLeft: '3px solid #faad14' }}>
              <Text style={{ fontSize: 12, color: '#d46b08' }}>
                <strong>注意：</strong>
                <br />
                • 加入后，您仍然是任务的承接者
                <br />
                • 组群成员可以查看任务详情和进度
                <br />
                • 此操作不可撤销
              </Text>
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};