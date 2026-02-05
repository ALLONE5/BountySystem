import React from 'react';
import { Avatar, Tooltip, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface UserChipProps {
  avatarUrl?: string;
  username: string;
  tip?: React.ReactNode;
  size?: number | 'small' | 'default' | 'large';
  highlight?: boolean;
  onClick?: () => void;
  extra?: React.ReactNode;
}

export const UserChip: React.FC<UserChipProps> = ({
  avatarUrl,
  username,
  tip,
  size = 'small',
  highlight = false,
  onClick,
  extra,
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginRight: 12,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <Avatar src={avatarUrl} icon={<UserOutlined />} size={size} style={highlight ? { border: '2px solid #1890ff' } : undefined} />
      <Text style={{ marginLeft: 6 }}>{username}</Text>
      {extra && <span style={{ marginLeft: 6 }}>{extra}</span>}
    </div>
  );

  if (tip) {
    return <Tooltip title={tip}>{content}</Tooltip>;
  }
  return content;
};
