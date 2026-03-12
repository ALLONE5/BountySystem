import React from 'react';
import { Card } from 'antd';
import { Task } from '../types';
import { TaskListContainer } from '../components/TaskList/TaskListContainer';
import { log } from '../utils/logger';
import './TaskListPage.css';

interface TaskListPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
  onTaskUpdated?: () => void;
  showAssignButton?: boolean;
  onAssignTask?: (task: Task) => void;
  showAcceptButton?: boolean;
  onAcceptTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onPublishTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onJoinGroup?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  userGroups?: any[];
  isPublishedTasksPage?: boolean;
  isGroupTasksPage?: boolean;
}

export const TaskListPage: React.FC<TaskListPageProps> = ({ 
  hideFilters,
  ...props
}) => {
  log.componentRender('TaskListPage', { hideFilters });

  if (hideFilters) {
    return <TaskListContainer hideFilters={hideFilters} {...props} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <TaskListContainer {...props} />
      </Card>
    </div>
  );
};