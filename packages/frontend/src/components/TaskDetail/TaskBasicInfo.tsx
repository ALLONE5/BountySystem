/**
 * 任务基本信息组件
 * 显示任务的详细信息
 */

import React from 'react';
import { Typography, Tag, Space, Divider, Tooltip, Button } from 'antd';
import { TeamOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task, TaskStatus, Visibility, InvitationStatus } from '../../types';
import { InfoRow } from '../common/InfoRow';
import { UserChip } from '../common/UserChip';
import { StatusTag } from '../common/StatusTag';
import { formatBounty } from '../../utils/formatters';

const { Text } = Typography;

interface TaskBasicInfoProps {
  task: Task;
  assigneeFallback?: { username: string; avatarUrl?: string } | null;
  assistants: any[];
  onAddAssistant: () => void;
}

export const TaskBasicInfo: React.FC<TaskBasicInfoProps> = ({
  task,
  assigneeFallback,
  assistants,
  onAddAssistant
}) => {
  return (
    <div>
      <InfoRow label="状态">
        <StatusTag value={task.groupName && (task.status === TaskStatus.NOT_STARTED || task.status === TaskStatus.AVAILABLE) ? TaskStatus.IN_PROGRESS : task.status} />
      </InfoRow>

      {/* 显示邀请状态 */}
      {task.invitedUserId && task.invitationStatus && (
        <InfoRow label="邀请状态">
          <Space>
            {task.invitationStatus === InvitationStatus.PENDING && (
              <Tag color="orange" icon={<ClockCircleOutlined />}>待接受</Tag>
            )}
            {task.invitationStatus === InvitationStatus.ACCEPTED && (
              <Tag color="green" icon={<CheckOutlined />}>已接受</Tag>
            )}
            {task.invitationStatus === InvitationStatus.REJECTED && (
              <Tag color="red" icon={<CloseOutlined />}>已拒绝</Tag>
            )}
          </Space>
        </InfoRow>
      )}

      <InfoRow label="任务类型">
        {task.depth === 0 ? (
          <Tag color="green">顶级任务</Tag>
        ) : (
          <Tag color="blue">子任务</Tag>
        )}
      </InfoRow>

      {task.publisher && (
        <InfoRow label="发布者">
          <Space>
            <UserChip
              avatarUrl={task.publisher.avatarUrl}
              username={task.publisher.username}
              tip={task.publisher.email}
              size={32}
            />
            <Tag>{task.publisher.email}</Tag>
          </Space>
        </InfoRow>
      )}

      <InfoRow label="承接者 / 协作者">
        <Space wrap>
          {/* Show assignee user if exists, otherwise show fallback user, otherwise show "未分配" */}
          {task.assignee ? (
            <>
              <UserChip
                avatarUrl={task.assignee.avatarUrl}
                username={task.assignee.username}
                tip="承接者"
                size={32}
                highlight
              />
              {task.groupName && (
                <Tag color="geekblue" icon={<TeamOutlined />} style={{ padding: '4px 10px', fontSize: '14px' }}>
                  {task.groupName}
                </Tag>
              )}
            </>
          ) : assigneeFallback ? (
            <>
              <UserChip
                avatarUrl={assigneeFallback.avatarUrl}
                username={assigneeFallback.username}
                tip="承接者"
                size={32}
                highlight
              />
              {task.groupName && (
                <Tag color="geekblue" icon={<TeamOutlined />} style={{ padding: '4px 10px', fontSize: '14px' }}>
                  {task.groupName}
                </Tag>
              )}
            </>
          ) : (
            <>
              <Text type="secondary" style={{ marginRight: 16 }}>未分配</Text>
              {task.groupName && (
                <Tag color="geekblue" icon={<TeamOutlined />} style={{ padding: '4px 10px', fontSize: '14px' }}>
                  {task.groupName}
                </Tag>
              )}
            </>
          )}
          {assistants.map(assistant => (
            <UserChip
              key={assistant.id}
              avatarUrl={assistant.avatar_url}
              username={assistant.username}
              tip={`协作者 (赏金: ${assistant.bounty_allocation}%)`}
              extra={<Text type="secondary" style={{ fontSize: 12 }}>({assistant.bounty_allocation}%)</Text>}
            />
          ))}

          <Tooltip title="添加协作者">
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={onAddAssistant}
              style={{ padding: 4 }}
            />
          </Tooltip>
        </Space>
      </InfoRow>

      <InfoRow label="描述">
        <Text style={{ color: '#666' }}>{task.description || '无描述'}</Text>
      </InfoRow>

      {task.groupName && (
        <InfoRow label="所属组群">
          <Tag color="purple" icon={<TeamOutlined />}>{task.groupName}</Tag>
        </InfoRow>
      )}

      {task.projectGroupName && (
        <InfoRow label="项目分组">
          <Tag color="geekblue">{task.projectGroupName}</Tag>
        </InfoRow>
      )}

      <InfoRow label="可见性">
        {task.visibility === Visibility.PUBLIC && (
          <Tag color="green" icon={<TeamOutlined />}>公开</Tag>
        )}
        {task.visibility === Visibility.POSITION_ONLY && (
          <Tag color="orange">仅特定岗位</Tag>
        )}
        {task.visibility === Visibility.PRIVATE && (
          <Tag color="red">私有</Tag>
        )}
      </InfoRow>

      <Divider style={{ margin: '16px 0' }} />

      <InfoRow label="赏金">
        <Text strong style={{ fontSize: 16, color: '#faad14' }}>
          {formatBounty(task.bountyAmount)}
        </Text>
      </InfoRow>

      <Divider style={{ margin: '16px 0' }} />

      <InfoRow label="复杂度">
        <Tag color="blue">{task.complexity}/5</Tag>
      </InfoRow>

      <InfoRow label="优先级">
        <Tag color="orange">{task.priority}/5</Tag>
      </InfoRow>

      <InfoRow label="预估工时">
        <Text>{task.estimatedHours}小时</Text>
      </InfoRow>

      <Divider style={{ margin: '16px 0' }} />

      <InfoRow label="计划开始">
        <Text>{dayjs(task.plannedStartDate).format('YYYY-MM-DD HH:mm')}</Text>
      </InfoRow>

      <InfoRow label="计划结束">
        <Text>{dayjs(task.plannedEndDate).format('YYYY-MM-DD HH:mm')}</Text>
      </InfoRow>

      {task.actualStartDate && (
        <InfoRow label="实际开始">
          <Text>{dayjs(task.actualStartDate).format('YYYY-MM-DD HH:mm')}</Text>
        </InfoRow>
      )}

      {task.actualEndDate && (
        <InfoRow label="实际结束">
          <Text>{dayjs(task.actualEndDate).format('YYYY-MM-DD HH:mm')}</Text>
        </InfoRow>
      )}

      {task.tags && task.tags.length > 0 && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <InfoRow label="标签">
            <Space wrap>
              {task.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </InfoRow>
        </>
      )}

      <Divider style={{ margin: '16px 0' }} />

      <InfoRow label="创建时间">
        <Text type="secondary">{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
      </InfoRow>
    </div>
  );
};