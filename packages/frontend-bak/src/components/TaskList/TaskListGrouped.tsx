/**
 * 按项目分组的任务列表组件
 * 处理任务按项目分组的展示
 */

import React from 'react';
import { Collapse, Space, Badge } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { Task, TaskStatus } from '../../types';
import { TaskListTable } from './TaskListTable';
import { useTheme } from '../../contexts/ThemeContext';

const { Panel } = Collapse;

interface TaskListGroupedProps {
  tasks: Task[];
  loading: boolean;
  expandedProjects: string[];
  onExpandedProjectsChange: (keys: string[]) => void;
  onTaskClick: (task: Task) => void;
  getSubtaskCount: (taskId: string) => number;
  
  // Action props - pass through to TaskListTable
  user?: any;
  userGroups?: any[];
  showAssignButton?: boolean;
  showAcceptButton?: boolean;
  isPublishedTasksPage?: boolean;
  isGroupTasksPage?: boolean;
  
  // Action callbacks - pass through to TaskListTable
  onAssignTask?: (task: Task) => void;
  onAcceptTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onPublishTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onJoinGroup?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskListGrouped: React.FC<TaskListGroupedProps> = ({
  tasks,
  loading,
  expandedProjects,
  onExpandedProjectsChange,
  onTaskClick,
  getSubtaskCount,
  ...actionProps
}) => {
  const { themeMode } = useTheme();

  // Group tasks by project
  const groupTasksByProject = (): Record<string, Task[]> => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const key = task.projectGroupName || '无项目组';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });
    return grouped;
  };

  // Calculate project statistics
  const getProjectStats = (projectTasks: Task[]) => {
    const inProgress = projectTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = projectTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const totalBounty = projectTasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0);
    return { inProgress, completed, totalBounty };
  };

  return (
    <Collapse
      activeKey={expandedProjects}
      onChange={(keys) => onExpandedProjectsChange(keys as string[])}
      style={{ background: 'transparent', border: 'none' }}
    >
      {Object.entries(groupTasksByProject()).map(([projectName, projectTasks]) => {
        const stats = getProjectStats(projectTasks);
        return (
          <Panel
            key={projectName}
            header={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Space>
                  <FolderOutlined style={{ 
                    color: themeMode === 'dark' ? '#00d9ff' : '#722ed1', 
                    fontSize: 16 
                  }} />
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: 14, 
                    color: themeMode === 'dark' ? '#f8fafc' : '#0f172a'
                  }}>
                    {projectName}
                  </span>
                  <Badge count={projectTasks.length} style={{ 
                    backgroundColor: themeMode === 'dark' ? '#00d9ff' : '#722ed1' 
                  }} />
                </Space>
                <Space size="large" onClick={(e) => e.stopPropagation()}>
                  <span style={{ 
                    fontSize: 13, 
                    color: themeMode === 'dark' ? '#94a3b8' : '#666' 
                  }}>
                    {stats.inProgress} 进行中
                  </span>
                  <span style={{ 
                    fontSize: 13, 
                    color: themeMode === 'dark' ? '#94a3b8' : '#666' 
                  }}>
                    {stats.completed} 已完成
                  </span>
                  <span style={{ 
                    fontSize: 13, 
                    color: themeMode === 'dark' ? '#ff6b6b' : '#f5222d', 
                    fontWeight: 600 
                  }}>
                    ${stats.totalBounty.toFixed(2)}
                  </span>
                </Space>
              </div>
            }
            style={{
              marginBottom: 16,
              background: themeMode === 'dark' ? '#1f2937' : '#fff',
              borderRadius: 4,
              border: themeMode === 'dark' ? '1px solid rgba(0, 242, 255, 0.1)' : '1px solid #d9d9d9',
            }}
          >
            <TaskListTable
              tasks={projectTasks}
              loading={loading}
              tableParams={{ pagination: undefined }}
              onTableChange={() => {}}
              onTaskClick={onTaskClick}
              getSubtaskCount={getSubtaskCount}
              {...actionProps}
            />
          </Panel>
        );
      })}
    </Collapse>
  );
};