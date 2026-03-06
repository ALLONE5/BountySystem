import React, { useState } from 'react';
import { Modal, Select, Space, Typography, Avatar, Spin } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { Task, User } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { userApi } from '../../api/user';

const { Text } = Typography;
const { Option } = Select;

interface TaskAssignModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onAssign: (taskId: string, userId: string) => Promise<void>;
}

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const TaskAssignModal: React.FC<TaskAssignModalProps> = ({
  visible,
  task,
  onClose,
  onAssign,
}) => {
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [assignLoading, setAssignLoading] = useState(false);
  const { handleError } = useErrorHandler();

  const handleSearchUsers = debounce(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const results = await userApi.searchUsers(query);
      setUsers(results);
    } catch (error) {
      handleError(error, '搜索用户失败', { context: 'TaskAssignModal.searchUsers' });
    } finally {
      setSearchingUsers(false);
    }
  }, 300);

  const handleAssignConfirm = async () => {
    if (!task || !selectedUserId) {
      return;
    }
    
    setAssignLoading(true);
    try {
      await onAssign(task.id, selectedUserId);
      handleClose();
    } catch (error) {
      // 错误处理由父组件处理
    } finally {
      setAssignLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId(undefined);
    setUsers([]);
    onClose();
  };

  return (
    <Modal
      title="指派任务"
      open={visible}
      onOk={handleAssignConfirm}
      onCancel={handleClose}
      okText="确认指派"
      cancelText="取消"
      confirmLoading={assignLoading}
    >
      <Space style={{ width: '100%', flexDirection: 'column' }}>
        <div>
          <Text strong>任务名称：</Text>
          <Text>{task?.name}</Text>
        </div>
        <div style={{ width: '100%' }}>
          <Text strong>选择用户：</Text>
          <Select
            showSearch
            placeholder="搜索用户（输入用户名或邮箱）"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedUserId}
            onChange={setSelectedUserId}
            onSearch={handleSearchUsers}
            loading={searchingUsers}
            notFoundContent={searchingUsers ? <Spin size="small" /> : null}
            suffixIcon={<SearchOutlined />}
            filterOption={false}
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>
                <Space>
                  <Avatar src={user.avatarUrl} size="small" icon={<UserOutlined />} />
                  <span>{user.username}</span>
                  <Text type="secondary">({user.email})</Text>
                </Space>
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            提示：指派后任务将自动设置为私有，被指派用户会收到通知
          </Text>
        </div>
      </Space>
    </Modal>
  );
};