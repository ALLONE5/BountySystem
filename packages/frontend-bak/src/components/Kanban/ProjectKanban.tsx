/**
 * 项目分组看板组件
 * 按项目组分组显示看板
 */

import React from 'react';
import { Collapse, Space, Badge } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../../types';
import { KanbanBoard } from './KanbanBoard';

const { Panel } = Collapse;

interface ProjectKanbanProps {
  tasks: Task[];
  expandedProjects: string[];
  onExpandedProjectsChange: (keys: string[]) => void;
  onDragEnd: (result: DropResult) => void;
  onTaskClick: (task: Task) => void;
}

export const ProjectKanban: React.FC<ProjectKanbanProps> = ({
  tasks,
  expandedProjects,
  onExpandedProjectsChange,
  onDragEnd,
  onTaskClick
}) => {
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
                  <FolderOutlined className="project-kanban-icon" style={{ fontSize: 16 }} />
                  <span className="project-kanban-title" style={{ fontWeight: 600, fontSize: 14 }}>{projectName}</span>
                  <Badge count={projectTasks.length} className="project-kanban-badge" style={{ backgroundColor: '#722ed1' }} />
                </Space>
                <Space size="large" onClick={(e) => e.stopPropagation()}>
                  <span className="project-kanban-stat" style={{ fontSize: 13 }}>
                    {stats.inProgress} 进行中
                  </span>
                  <span className="project-kanban-stat" style={{ fontSize: 13 }}>
                    {stats.completed} 已完成
                  </span>
                  <span className="project-kanban-bounty" style={{ fontSize: 13, fontWeight: 600 }}>
                    ${stats.totalBounty.toFixed(2)}
                  </span>
                </Space>
              </div>
            }
            style={{
              marginBottom: 16,
              background: '#fff',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
          >
            <KanbanBoard
              tasks={projectTasks}
              droppablePrefix={`${projectName}-`}
              onDragEnd={onDragEnd}
              onTaskClick={onTaskClick}
            />
          </Panel>
        );
      })}
    </Collapse>
  );
};