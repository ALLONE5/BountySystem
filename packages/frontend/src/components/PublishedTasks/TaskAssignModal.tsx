import React, { useState } from 'react';
import { Select, Space, Typography, Avatar, Spin, Form } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { BaseFormModal } from '../common/BaseFormModal';
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
  const [form] = Form.useForm();
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (values: { userId: string }) => {
    if (!task || !values.userId) {
      return;
    }
    
    setLoading(true);
    try {
      await onAssign(task.id, values.userId);
      onClose();
    } catch (error) {
      // 错误处理由父组件处理
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsers([]);
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      title="指派任务"
      form={form}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      okText="确认指派"
      cancelText="取消"
      loading={loading}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>任务名称：</Text>
        <Text>{task?.name}</Text>
      </div>
      
      <Form.Item
        name="userId"
        label="选择用户"
        rules={[{ required: true, message: '请选择要指派的用户' }]}
      >
        <Select
          showSearch
          placeholder="搜索用户（输入用户名或邮箱）"
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
      </Form.Item>
      
      <div style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          提示：指派后任务将自动设置为私有，被指派用户会收到通知
        </Text>
      </div>
    </BaseFormModal>
  );
};
