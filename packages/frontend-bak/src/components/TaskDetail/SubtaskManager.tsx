/**
 * 子任务管理组件
 * 显示和管理子任务列表
 */

import React from 'react';
import { List, Progress, Badge, Tag, Space, Button, Popover, Card } from 'antd';
import { EyeOutlined, TeamOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task } from '../../types';
import { UserChip } from '../common/UserChip';
import { StatusTag } from '../common/StatusTag';
import { TaskViews } from '../TaskViews';

interface SubtaskManagerProps {
  task: Task;
  subtasks: Task[];
  subtaskPopoverVisible: Record<string, boolean>;
  onSubtaskClick: (subtaskId: string) => void;
  onPublishSubtask: (subtask: Task) => void;
  onDeleteSubtask: (subtaskId: string, subtaskName: string) => void;
  onCreateSubtask: () => void;
  renderSubtaskPopoverContent: () => React.ReactNode;
  setSubtaskPopoverVisible: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSubtaskInPopover: (task: Task | null) => void;
}

export const SubtaskManager: React.FC<SubtaskManagerProps> = ({
  task,
  subtasks,
  subtaskPopoverVisible,
  onSubtaskClick,
  onPublishSubtask,
  onDeleteSubtask,
  onCreateSubtask,
  renderSubtaskPopoverContent,
  setSubtaskPopoverVisible,
  setSubtaskInPopover
}) => {
  // 创建子任务列表视图
  const subtaskListView = (
    <List
      dataSource={subtasks}
      locale={{ emptyText: '暂无子任务' }}
      renderItem={(sub) => (
        <List.Item
          actions={[
            <Popover
              key="popover"
              content={renderSubtaskPopoverContent()}
              title={null}
              trigger="click"
              open={subtaskPopoverVisible[sub.id] || false}
              onOpenChange={(visible) => {
                // Update visibility state first
                setSubtaskPopoverVisible(prev => ({
                  ...prev,
                  [sub.id]: visible
                }));
                
                if (visible) {
                  // Fetch subtask data when opening
                  onSubtaskClick(sub.id);
                } else {
                  // Clear subtask data when closing
                  setSubtaskInPopover(null);
                }
              }}
              placement="left"
              overlayStyle={{ maxWidth: '650px' }}
            >
              <Button 
                type="link" 
                size="small"
                icon={<EyeOutlined />}
              >
                查看详情
              </Button>
            </Popover>,
            // Show publish button only if subtask is not published yet
            !sub.isPublished && sub.assigneeId ? (
              <Button
                key="publish"
                type="link"
                size="small"
                icon={<TeamOutlined />}
                onClick={() => onPublishSubtask(sub)}
              >
                发布
              </Button>
            ) : null,
            <Button
              key="delete"
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDeleteSubtask(sub.id, sub.name)}
            >
              删除
            </Button>,
          ].filter(Boolean)}
        >
          <List.Item.Meta
            title={
              <Space size="small">
                <Badge color="blue" text={sub.name} />
                <StatusTag value={sub.status} />
                {typeof sub.priority === 'number' && <Tag color="gold">P{sub.priority}</Tag>}
              </Space>
            }
            description={
              <Space size="middle" wrap>
                <span>
                  计划: {sub.plannedStartDate ? dayjs(sub.plannedStartDate).format('MM/DD') : '--'}
                  {' '}~ {sub.plannedEndDate ? dayjs(sub.plannedEndDate).format('MM/DD') : '--'}
                </span>
                <Space size="small">
                  进度: <Progress percent={sub.progress} size="small" steps={5} strokeColor="#52c41a" style={{ width: 60 }} />
                </Space>
                {sub.assignee ? (
                  <Space size={4}>
                    <UserChip 
                      username={sub.assignee.username} 
                      avatarUrl={sub.assignee.avatarUrl} 
                      size={20} 
                    />
                  </Space>
                ) : (
                    <Tag>待指派</Tag>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  return (
    <Card 
      variant="borderless"
      bodyStyle={{ padding: 0 }}
    >
      <TaskViews
        tasks={subtasks}
        loading={false}
        listView={subtaskListView}
        extra={
          // Only show "Create Subtask" button for top-level tasks (depth 0)
          // System only allows 2 levels: depth 0 (parent) and depth 1 (subtask)
          // NEW REQUIREMENT: Button is disabled if task has no assignee
          task && task.depth === 0 ? (
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={onCreateSubtask}
              disabled={!task.assigneeId}
              title={!task.assigneeId ? '母任务必须先被承接才能创建子任务' : ''}
            >
              创建子任务
            </Button>
          ) : null
        }
      />
    </Card>
  );
};