import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { EyeOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { TaskGroup } from '../../types';

const { Text } = Typography;

interface GroupCardProps {
  group: TaskGroup;
  onViewGroup: (group: TaskGroup) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onViewGroup }) => {
  return (
    <Card
      hoverable
      className="task-card"
      onClick={() => onViewGroup(group)}
      style={{ borderLeft: '4px solid #1890ff' }}
      actions={[
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onViewGroup(group);
          }}
        >
          查看详情
        </Button>,
      ]}
    >
      <Card.Meta
        avatar={<TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
        title={<Text strong style={{ fontSize: 16 }}>{group.name}</Text>}
        description={
          <Space direction="vertical" size={4}>
            <Text type="secondary">
              <UserOutlined /> 成员数: {group.members?.length || group.memberIds?.length || 0}
            </Text>
            <Text type="secondary">
              创建时间: {dayjs(group.createdAt).format('YYYY-MM-DD')}
            </Text>
          </Space>
        }
      />
    </Card>
  );
};