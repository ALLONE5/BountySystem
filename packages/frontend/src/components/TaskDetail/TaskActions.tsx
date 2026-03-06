/**
 * 任务操作按钮组件
 * 显示任务相关的操作按钮
 */

import React from 'react';
import { Button, Space } from 'antd';
import { TeamOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Task, TaskStatus, InvitationStatus } from '../../types';

interface TaskActionsProps {
  task: Task;
  user: any;
  userGroups: any[];
  bonusRewards: any[];
  isAssignee: boolean;
  isPublisher: boolean;
  isInvitedUser: boolean;
  invitationActionLoading: boolean;
  onCompleteTask?: (taskId: string) => void;
  onEditTask: () => void;
  onConvertToGroup: () => void;
  onAddBonus: () => void;
  onAcceptInvitation: () => void;
  onRejectInvitation: () => void;
  onClose: () => void;
}

export const TaskActions: React.FC<TaskActionsProps> = ({
  task,
  user,
  userGroups,
  bonusRewards,
  isAssignee,
  isPublisher,
  isInvitedUser,
  invitationActionLoading,
  onCompleteTask,
  onEditTask,
  onConvertToGroup,
  onAddBonus,
  onAcceptInvitation,
  onRejectInvitation,
  onClose
}) => {
  const buttons: React.ReactNode[] = [];

  // 邀请状态操作按钮
  if (isInvitedUser && task.invitationStatus === InvitationStatus.PENDING) {
    buttons.push(
      <Button
        key="accept"
        type="primary"
        size="small"
        icon={<CheckOutlined />}
        onClick={onAcceptInvitation}
        loading={invitationActionLoading}
      >
        接受
      </Button>
    );
    buttons.push(
      <Button
        key="reject"
        danger
        size="small"
        icon={<CloseOutlined />}
        onClick={onRejectInvitation}
        loading={invitationActionLoading}
      >
        拒绝
      </Button>
    );
  }

  // 如果是承接者且任务进行中，显示完成按钮
  if (isAssignee && task.status === TaskStatus.IN_PROGRESS) {
    if (onCompleteTask) {
      buttons.push(
        <Button
          key="complete"
          type="primary"
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          onClick={() => onCompleteTask(task.id)}
        >
          完成
        </Button>
      );
    }
  }

  // 如果是管理员且任务已完成，显示额外奖赏按钮
  if (
    (user?.role === 'super_admin' || user?.role === 'position_admin') &&
    task.status === TaskStatus.COMPLETED &&
    task.assigneeId
  ) {
    // 检查当前管理员是否已经给过奖赏
    const hasGivenBonus = bonusRewards.some(reward => reward.from_user_id === user?.id);
    
    buttons.push(
      <Button
        key="bonus"
        type="default"
        style={{ borderColor: '#faad14', color: '#faad14' }}
        onClick={onAddBonus}
        disabled={hasGivenBonus}
      >
        {hasGivenBonus ? '已奖赏' : '额外奖赏'}
      </Button>
    );
  }

  // 如果是承接者，显示群组按钮（已关联显示群组信息，未关联可以加入）
  if (isAssignee && userGroups.length > 0) {
    buttons.push(
      <Button
        key="convertToGroup"
        icon={<TeamOutlined />}
        onClick={onConvertToGroup}
      >
        群组
      </Button>
    );
  }

  // 如果是发布者，显示编辑按钮
  if (isPublisher) {
    buttons.push(
      <Button
        key="edit"
        icon={<EditOutlined />}
        onClick={onEditTask}
      >
        编辑
      </Button>
    );
  }

  // 始终显示关闭按钮
  buttons.push(
    <Button key="close" onClick={onClose}>
      关闭
    </Button>
  );

  return <Space>{buttons}</Space>;
};