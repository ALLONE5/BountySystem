/**
 * 用户详情抽屉组件
 * 显示用户的详细信息
 */

import React from 'react';
import { Drawer, Descriptions, Space, Button, Avatar, Typography, Divider } from 'antd';
import { EditOutlined, UserOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { User, UserRole, Position } from '../../types';
import { StatusTag } from '../common/StatusTag';
import { TagList } from '../common/TagList';
import { ConfirmDeleteButton } from '../common/ConfirmDeleteButton';

const { Title, Text } = Typography;

interface UserWithDetails extends User {
  positions?: Position[];
  managedPositions?: Position[];
}

interface UserDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  user: UserWithDetails | null;
  currentUser: User | null;
  onEdit: (user: UserWithDetails) => void;
  onDelete: (userId: string) => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  open,
  onClose,
  user,
  currentUser,
  onEdit,
  onDelete
}) => {
  if (!user) return null;

  const canEdit = currentUser?.role === UserRole.SUPER_ADMIN || 
                  (currentUser?.role === UserRole.POSITION_ADMIN && user.role === UserRole.USER);
  
  const canDelete = currentUser?.role === UserRole.SUPER_ADMIN && user.id !== currentUser.id;

  return (
    <Drawer
      title={
        <Space>
          <Avatar 
            src={user.avatarUrl} 
            icon={<UserOutlined />} 
            size="large"
          />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {user.username}
            </Title>
            <Text type="secondary">{user.email}</Text>
          </div>
        </Space>
      }
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit(user)}
            >
              编辑
            </Button>
          )}
          {canDelete && (
            <ConfirmDeleteButton
              buttonProps={{ 
                danger: true,
                icon: undefined
              }}
              onConfirm={() => onDelete(user.id)}
              buttonText="删除用户"
              popconfirmProps={{
                title: '确定要删除此用户吗？',
                description: '此操作不可撤销，将删除用户的所有相关数据',
              }}
            />
          )}
        </Space>
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item 
          label={
            <Space>
              <UserOutlined />
              用户名
            </Space>
          }
        >
          {user.username}
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <MailOutlined />
              邮箱
            </Space>
          }
        >
          {user.email}
        </Descriptions.Item>

        <Descriptions.Item label="角色">
          <StatusTag value={user.role} />
        </Descriptions.Item>

        <Descriptions.Item label="赏金余额">
          <Text strong style={{ color: '#faad14', fontSize: 16 }}>
            {user.bounty?.toLocaleString() || 0} 积分
          </Text>
        </Descriptions.Item>

        {user.positions && user.positions.length > 0 && (
          <Descriptions.Item label="岗位">
            <TagList
              items={user.positions.map((pos) => ({ key: pos.id, label: pos.name }))}
              emptyText="无岗位"
            />
          </Descriptions.Item>
        )}

        {user.managedPositions && user.managedPositions.length > 0 && (
          <Descriptions.Item label="管理岗位">
            <TagList
              items={user.managedPositions.map((pos) => ({ key: pos.id, label: pos.name }))}
              emptyText="无管理岗位"
            />
          </Descriptions.Item>
        )}

        <Descriptions.Item 
          label={
            <Space>
              <CalendarOutlined />
              注册时间
            </Space>
          }
        >
          {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>

        <Descriptions.Item label="最后更新">
          {dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <div style={{ textAlign: 'center', color: '#999' }}>
        <Text type="secondary">用户ID: {user.id}</Text>
      </div>
    </Drawer>
  );
};