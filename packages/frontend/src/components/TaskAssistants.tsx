import React, { useEffect, useState, useRef } from 'react';
import { List, Avatar, Button, Modal, InputNumber, Select, Form, Tag, Spin } from 'antd';
import { UserOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { taskApi } from '../api/task';
import { userApi } from '../api/user';
import { useAuthStore } from '../store/authStore';
import { Task, UserRole, User } from '../types';
import { logger } from '../utils/logger';
import { message } from '../utils/message';

export interface Assistant {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  bounty_allocation: number;
}

interface TaskAssistantsProps {
  taskId: string;
  task: Task;
}

export const TaskAssistants: React.FC<TaskAssistantsProps> = ({ taskId, task }) => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  // Search state
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const fetchAssistants = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getAssistants(taskId);
      setAssistants(data);
    } catch (error) {
      message.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, [taskId]);

  const handleSearch = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!value) {
      setUserOptions([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const users = await userApi.searchUsers(value);
        setUserOptions(users);
      } catch (error) {
        logger.error('Failed to search users', error);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleAddAssistant = async (values: { assistantId: string; bountyAllocation: number }) => {
    setSubmitting(true);
    try {
      await taskApi.addAssistant(taskId, values.assistantId, values.bountyAllocation);
      message.success('Assistant added');
      setIsModalVisible(false);
      form.resetFields();
      fetchAssistants();
    } catch (error) {
      message.error('Failed to add assistant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssistant = async (assistantId: string) => {
    try {
      await taskApi.removeAssistant(taskId, assistantId);
      message.success('Assistant removed');
      fetchAssistants();
    } catch (error) {
      message.error('Failed to remove assistant');
    }
  };

  const canManageAssistants = user && (
    user.role === UserRole.SUPER_ADMIN ||
    task.assigneeId === user.id
  );

  return (
    <div style={{ marginTop: 16 }}>
      {canManageAssistants && (
        <Button icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ marginBottom: 16 }}>
          Add Assistant
        </Button>
      )}
      
      <List
        loading={loading}
        dataSource={assistants}
        renderItem={(item) => (
          <List.Item
            actions={canManageAssistants ? [
              <Button 
                key="delete" 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => handleRemoveAssistant(item.id)}
              />
            ] : []}
          >
            <List.Item.Meta
              avatar={<Avatar src={item.avatar_url} icon={<UserOutlined />} />}
              title={item.username}
              description={<Tag color="gold">Bounty: {item.bounty_allocation}%</Tag>}
            />
          </List.Item>
        )}
      />

      <Modal
        title="Add Assistant"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddAssistant} layout="vertical">
          <Form.Item name="assistantId" label="User" rules={[{ required: true, message: 'Please select a user' }]}>
             <Select
                showSearch
                placeholder="Search user by name or ID"
                filterOption={false}
                onSearch={handleSearch}
                notFoundContent={searching ? <Spin size="small" /> : null}
                options={userOptions.map(u => ({
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar size="small" src={u.avatarUrl} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                      {u.username} ({u.email})
                    </div>
                  ),
                  value: u.id,
                }))}
             />
          </Form.Item>
          <Form.Item name="bountyAllocation" label="Bounty Allocation (%)" rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Add
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
