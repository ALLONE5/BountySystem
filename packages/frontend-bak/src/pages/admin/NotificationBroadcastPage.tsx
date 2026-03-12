import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Space,
  Alert,
  Divider,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { broadcastNotification } from '../../api/notification';
import { positionApi } from '../../api/position';
import { userApi } from '../../api/user';
import { logger } from '../../utils/logger';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const NotificationBroadcastPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'users' | 'role' | 'position'>('all');
  const [positions, setPositions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await positionApi.getAllPositions();
      setPositions(data);
    } catch (error) {
      logger.error('Failed to load positions:', error);
    }
  };

  const handleSearchUsers = async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const results = await userApi.searchUsers(keyword);
      setUsers(results);
    } catch (error) {
      logger.error('Failed to search users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const count = await broadcastNotification({
        title: values.title,
        message: values.message,
        targetType: values.targetType,
        targetValue: values.targetValue,
      });

      message.success(`通知已成功发送给 ${count} 位用户`);
      form.resetFields();
      setTargetType('all');
    } catch (error: any) {
      message.error(error.response?.data?.message || '发送通知失败');
    } finally {
      setLoading(false);
    }
  };

  const getTargetDescription = () => {
    switch (targetType) {
      case 'all':
        return '通知将发送给系统中的所有用户';
      case 'users':
        return '通知将发送给您选择的特定用户';
      case 'role':
        return '通知将发送给具有指定角色的所有用户';
      case 'position':
        return '通知将发送给具有指定岗位的所有用户';
      default:
        return '';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>发布通知</Title>
      <Text type="secondary">
        向系统用户发送通知消息。您可以选择发送给所有用户、特定用户、特定角色或特定岗位的用户。
      </Text>

      <Divider />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ targetType: 'all' }}
        >
          <Form.Item
            name="title"
            label="通知标题"
            rules={[
              { required: true, message: '请输入通知标题' },
              { max: 100, message: '标题不能超过100个字符' },
            ]}
          >
            <Input placeholder="例如：系统维护通知" />
          </Form.Item>

          <Form.Item
            name="message"
            label="通知内容"
            rules={[
              { required: true, message: '请输入通知内容' },
              { max: 500, message: '内容不能超过500个字符' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请输入通知的详细内容..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="targetType"
            label="发送对象"
            rules={[{ required: true, message: '请选择发送对象' }]}
          >
            <Select
              onChange={(value) => {
                setTargetType(value);
                form.setFieldsValue({ targetValue: undefined });
              }}
            >
              <Option value="all">所有用户</Option>
              <Option value="users">指定用户</Option>
              <Option value="role">指定角色</Option>
              <Option value="position">指定岗位</Option>
            </Select>
          </Form.Item>

          <Alert
            title={getTargetDescription()}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {targetType === 'users' && (
            <Form.Item
              name="targetValue"
              label="选择用户"
              rules={[{ required: true, message: '请选择至少一个用户' }]}
            >
              <Select
                mode="multiple"
                placeholder="搜索并选择用户"
                showSearch
                filterOption={false}
                onSearch={handleSearchUsers}
                loading={searchingUsers}
                notFoundContent={searchingUsers ? '搜索中...' : '请输入至少2个字符进行搜索'}
              >
                {users.map((user) => (
                  <Option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {targetType === 'role' && (
            <Form.Item
              name="targetValue"
              label="选择角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="选择用户角色">
                <Option value="user">普通用户</Option>
                <Option value="position_admin">岗位管理员</Option>
                <Option value="super_admin">超级管理员</Option>
              </Select>
            </Form.Item>
          )}

          {targetType === 'position' && (
            <Form.Item
              name="targetValue"
              label="选择岗位"
              rules={[{ required: true, message: '请选择岗位' }]}
            >
              <Select
                placeholder="选择岗位"
                showSearch
                optionFilterProp="children"
              >
                {positions.map((position) => (
                  <Option key={position.id} value={position.id}>
                    {position.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
              >
                发送通知
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 24 }} title="使用说明">
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Text>
            <strong>所有用户：</strong>通知将发送给系统中的所有注册用户
          </Text>
          <Text>
            <strong>指定用户：</strong>通过搜索选择特定的用户，通知只发送给这些用户
          </Text>
          <Text>
            <strong>指定角色：</strong>通知将发送给具有指定角色的所有用户（普通用户、岗位管理员、超级管理员）
          </Text>
          <Text>
            <strong>指定岗位：</strong>通知将发送给已获批准加入指定岗位的所有用户
          </Text>
        </Space>
      </Card>
    </div>
  );
};
