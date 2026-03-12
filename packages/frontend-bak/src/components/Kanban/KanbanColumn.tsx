/**
 * 看板列组件
 * 显示单个状态列及其任务
 */

import React from 'react';
import { Badge } from 'antd';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: {
    key: TaskStatus;
    title: string;
    color: string;
  };
  tasks: Task[];
  droppablePrefix: string;
  onTaskClick: (task: Task) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  droppablePrefix,
  onTaskClick
}) => {
  return (
    <div
      className="kanban-column"
      style={{
        flex: '1',
        minWidth: '300px',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div
        className="kanban-column-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '6px',
          borderLeft: `4px solid ${column.color}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <span className="kanban-column-title" style={{ fontWeight: 600, fontSize: '15px' }}>
          {column.title}
        </span>
        <Badge
          count={tasks.length}
          style={{ backgroundColor: column.color }}
          showZero
        />
      </div>

      <Droppable droppableId={`${droppablePrefix}${column.key}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: '500px',
              backgroundColor: snapshot.isDraggingOver
                ? 'rgba(59, 130, 246, 0.1)'
                : 'transparent',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              padding: '4px',
            }}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      marginBottom: '12px',
                    }}
                  >
                    <KanbanCard
                      task={task}
                      columnColor={column.color}
                      isDragging={snapshot.isDragging}
                      onTaskClick={onTaskClick}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};