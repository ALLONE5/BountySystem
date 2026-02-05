/**
 * 用户头像组件
 */
import React from 'react';
import { Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { User } from '../../types';

const { Text } = Typography;

interface UserAvatarProps {
  user: User | { id: string; username: string; avatarUrl?: string };
  size?: number;
  showName?: boolean;
  nameStyle?: React.CSSProperties;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 32, 
  showName = false,
  nameStyle,
}) => {
  const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : undefined;

  if (!showName) {
    return (
      <Avatar 
        src={avatarUrl} 
        icon={!avatarUrl ? <UserOutlined /> : undefined}
        size={size}
      />
    );
  }

  return (
    <Space size="small">
      <Avatar 
        src={avatarUrl} 
        icon={!avatarUrl ? <UserOutlined /> : undefined}
        size={size}
      />
      <Text style={nameStyle}>{user.username}</Text>
    </Space>
  );
};
