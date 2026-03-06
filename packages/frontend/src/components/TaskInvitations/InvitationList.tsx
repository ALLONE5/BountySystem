import React from 'react';
import { List, Empty } from 'antd';
import { Task } from '../../types';
import { InvitationItem } from './InvitationItem';

interface InvitationListProps {
  invitations: Task[];
  actionLoading: string | null;
  onAccept: (task: Task) => void;
  onReject: (task: Task) => void;
  onViewDetails: (task: Task) => void;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  invitations,
  actionLoading,
  onAccept,
  onReject,
  onViewDetails,
}) => {
  if (invitations.length === 0) {
    return (
      <Empty
        description="暂无任务邀请"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <List
      dataSource={invitations}
      renderItem={(task) => (
        <InvitationItem
          key={task.id}
          task={task}
          actionLoading={actionLoading}
          onAccept={onAccept}
          onReject={onReject}
          onViewDetails={onViewDetails}
        />
      )}
    />
  );
};