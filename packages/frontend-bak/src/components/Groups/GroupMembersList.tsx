import React from 'react';
import { Card, Button, Space, Empty } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { TaskGroup } from '../../types';
import { StatusTag } from '../common/StatusTag';
import { UserChip } from '../common/UserChip';

interface GroupMembersListProps {
  group: TaskGroup;
  currentUserId?: string;
  onInviteMember: () => void;
}

export const GroupMembersList: React.FC<GroupMembersListProps> = ({
  group,
  currentUserId,
  onInviteMember,
}) => {
  const getAvatarUrl = (avatarUrl?: string, seed?: string) => {
    if (avatarUrl) return avatarUrl;
    if (seed) return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
    return undefined;
  };

  return (
    <Card 
      title="成员列表" 
      style={{ marginBottom: 16 }}
      extra={
        group.creatorId === currentUserId && (
          <Button 
            type="primary" 
            size="small" 
            icon={<UserAddOutlined />}
            onClick={onInviteMember}
          >
            邀请成员
          </Button>
        )
      }
    >
      {group.members && group.members.length > 0 ? (
        <Space wrap>
          {group.members.map((member) => (
            <UserChip
              key={member.id}
              avatarUrl={getAvatarUrl(member.avatarUrl, member.avatarId || member.username)}
              username={member.username}
              tip={member.email}
              size={40}
              extra={<StatusTag value={member.role as any} />}
            />
          ))}
        </Space>
      ) : (
        <Empty description="暂无成员" />
      )}
    </Card>
  );
};