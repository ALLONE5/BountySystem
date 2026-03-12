/**
 * 任务列表组件
 * 显示分组的任务列表和加载更多功能
 */

import React from 'react';
import { Empty, Spin, Button, Typography } from 'antd';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';

const { Title, Text } = Typography;

interface TaskListProps {
  tasks: Task[];
  groupBy: 'none' | 'position' | 'tag' | 'complexity' | 'group' | 'projectGroup';
  loading: boolean;
  hasMore: boolean;
  onViewDetail: (task: Task) => void;
  onAcceptTask: (taskId: string) => void;
  onLoadMore: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  groupBy,
  loading,
  hasMore,
  onViewDetail,
  onAcceptTask,
  onLoadMore
}) => {
  const groupTasks = () => {
    if (groupBy === 'none') {
      return { '所有任务': tasks };
    }

    const grouped: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      let key = '';
      switch (groupBy) {
        case 'position':
          key = task.positionName || (task.positionId ? '未知岗位' : '无岗位要求');
          break;
        case 'tag':
          key = (task.tags && task.tags.length > 0) ? task.tags[0] : '无标签';
          break;
        case 'complexity':
          key = `复杂度 ${task.complexity || 1}`;
          break;
        case 'group':
          key = task.groupName || '未分组';
          break;
        case 'projectGroup':
          key = task.projectGroupName || '无项目组';
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    return grouped;
  };

  const groupedTasks = groupTasks();

  if (loading && tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (Object.keys(groupedTasks).length === 0) {
    return <Empty description="暂无可承接的任务" />;
  }

  return (
    <div>
      {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
        <div key={groupName} style={{ marginBottom: 32 }}>
          {groupBy !== 'none' && (
            <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
              {groupName} <Text type="secondary">({groupTasks.length})</Text>
            </Title>
          )}
          {groupTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onViewDetail={onViewDetail}
              onAcceptTask={onAcceptTask}
            />
          ))}
        </div>
      ))}
      
      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>
          <Button
            type="default"
            size="large"
            loading={loading}
            onClick={onLoadMore}
            style={{ minWidth: 200 }}
          >
            {loading ? '加载中...' : '加载更多任务'}
          </Button>
        </div>
      )}
      
      {!hasMore && tasks.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>
          <Text type="secondary">已显示所有任务</Text>
        </div>
      )}
    </div>
  );
};