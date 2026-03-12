/**
 * 看板面板组件
 * 管理整个看板的拖拽和列显示
 */

import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';

const STATUS_COLUMNS = [
  { key: TaskStatus.NOT_STARTED, title: '未开始', color: '#d9d9d9' },
  { key: TaskStatus.AVAILABLE, title: '可承接', color: '#52c41a' },
  { key: TaskStatus.PENDING_ACCEPTANCE, title: '待接受', color: '#faad14' },
  { key: TaskStatus.IN_PROGRESS, title: '进行中', color: '#1890ff' },
  { key: TaskStatus.COMPLETED, title: '已完成', color: '#52c41a' },
];

interface KanbanBoardProps {
  tasks: Task[];
  droppablePrefix?: string;
  onDragEnd: (result: DropResult) => void;
  onTaskClick: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  droppablePrefix = '',
  onDragEnd,
  onTaskClick
}) => {
  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: 16 }}>
        {STATUS_COLUMNS.map(column => {
          const columnTasks = getTasksByStatus(column.key);
          return (
            <KanbanColumn
              key={column.key}
              column={column}
              tasks={columnTasks}
              droppablePrefix={droppablePrefix}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
};