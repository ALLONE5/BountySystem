import React from 'react';
import { Drawer, Typography, Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TaskGroup, Task } from '../../types';
import { TaskViews } from '../TaskViews';
import { TaskListPage } from '../../pages/TaskListPage';
import { GroupMembersList } from './GroupMembersList';
import { GroupStats } from './GroupStats';

const { Title } = Typography;

interface GroupDetailDrawerProps {
  visible: boolean;
  group: TaskGroup | null;
  tasks: Task[];
  loadingTasks: boolean;
  currentUserId?: string;
  onClose: () => void;
  onInviteMember: () => void;
  onCreateTask: () => void;
  onAcceptTask: (taskId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onTaskUpdated: () => Promise<void>;
}

export const GroupDetailDrawer: React.FC<GroupDetailDrawerProps> = ({
  visible,
  group,
  tasks,
  loadingTasks,
  currentUserId,
  onClose,
  onInviteMember,
  onCreateTask,
  onAcceptTask,
  onCompleteTask,
  onDeleteTask,
  onTaskUpdated,
}) => {
  if (!group) return null;

  return (
    <Drawer
      title="组群详情"
      placement="right"
      size="large"
      onClose={onClose}
      open={visible}
    >
      <div>
        <Title level={4}>{group.name}</Title>
        
        <GroupMembersList
          group={group}
          currentUserId={currentUserId}
          onInviteMember={onInviteMember}
        />

        <GroupStats tasks={tasks} />

        <Card 
          title="组群任务" 
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreateTask}
            >
              创建任务
            </Button>
          }
        >
          <TaskViews
            tasks={tasks}
            loading={loadingTasks}
            listView={
              <TaskListPage
                key={group.id}
                tasks={tasks}
                loading={loadingTasks}
                hideFilters
                showAcceptButton
                isGroupTasksPage
                onAcceptTask={onAcceptTask}
                onCompleteTask={onCompleteTask}
                onDeleteTask={onDeleteTask}
                onTaskUpdated={onTaskUpdated}
              />
            }
          />
        </Card>
      </div>
    </Drawer>
  );
};