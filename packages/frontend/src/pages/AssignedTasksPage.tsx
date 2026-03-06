import React, { useState } from 'react';
import { Typography, Card, Tabs, Badge, Modal } from 'antd';
import { CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { taskApi } from '../api/task';
import { groupApi } from '../api/group';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Task } from '../types';
import { TaskViews } from '../components/TaskViews';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { TaskListPage } from './TaskListPage';
import { AssignedTasksStats } from '../components/AssignedTasks/AssignedTasksStats';
import { TaskInvitationsList } from '../components/AssignedTasks/TaskInvitationsList';
import { TaskProgressModal } from '../components/AssignedTasks/TaskProgressModal';
import { GroupJoinModal } from '../components/AssignedTasks/GroupJoinModal';

const { Title, Text } = Typography;

export const AssignedTasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'invitations'>('assigned');
  const [taskDetailDrawerVisible, setTaskDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [groupJoinModalVisible, setGroupJoinModalVisible] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState<Task | null>(null);
  const { handleAsyncError } = useErrorHandler();

  // 使用 useDataFetch 加载承接的任务
  const { data: tasks = [], loading: tasksLoading, refetch: refetchTasks } = useDataFetch(
    () => taskApi.getAssignedTasks(),
    [],
    {
      errorMessage: '加载任务列表失败',
      context: 'AssignedTasksPage.loadTasks'
    }
  );

  // 使用 useDataFetch 加载任务邀请
  const { data: invitations = [], loading: invitationsLoading, refetch: refetchInvitations } = useDataFetch(
    () => taskApi.getTaskInvitations(),
    [],
    {
      errorMessage: '加载任务邀请失败',
      context: 'AssignedTasksPage.loadInvitations'
    }
  );

  // 使用 useDataFetch 加载用户群组
  const { data: userGroups = [] } = useDataFetch(
    () => groupApi.getUserGroups(),
    [],
    {
      context: 'AssignedTasksPage.loadUserGroups'
    }
  );

  const handleCompleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '确定要完成这个任务吗？',
      content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await handleAsyncError(
          async () => {
            await taskApi.completeTask(taskId);
            refetchTasks();
          },
          'AssignedTasksPage.completeTask',
          '任务已完成',
          '完成任务失败'
        );
      },
    });
  };

  const handleViewTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailDrawerVisible(true);
  };

  const handleTaskClick = async (taskId: string) => {
    await handleAsyncError(
      async () => {
        const task = await taskApi.getTask(taskId);
        setSelectedTask(task);
        setTaskDetailDrawerVisible(true);
      },
      'AssignedTasksPage.loadTaskDetail',
      undefined,
      '加载任务详情失败'
    );
  };

  const handleUpdateProgress = (task: Task) => {
    setSelectedTask(task);
    setProgressModalVisible(true);
  };

  const handleJoinGroup = (task: Task) => {
    setTaskToConvert(task);
    setGroupJoinModalVisible(true);
  };

  const handleTaskUpdated = async () => {
    await refetchTasks();
  };

  const handleInvitationUpdated = async () => {
    await Promise.all([refetchInvitations(), refetchTasks()]);
  };

  const invitationCount = invitations?.length || 0;

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>我的任务</Title>
          <Text type="secondary">查看和管理您承接的任务及任务邀请</Text>
        </div>
      </div>

      {/* Statistics Cards */}
      <AssignedTasksStats tasks={tasks || []} />

      {/* Tabs for Assigned Tasks and Invitations */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => setActiveTab(key as 'assigned' | 'invitations')}
          items={[
            {
              key: 'assigned',
              label: (
                <span style={{ fontSize: 15 }}>
                  <CheckCircleOutlined /> 已承接任务
                </span>
              ),
              children: (
                <TaskViews
                  tasks={tasks || []}
                  loading={tasksLoading}
                  listView={
                    <TaskListPage 
                      tasks={tasks || []} 
                      loading={tasksLoading} 
                      hideFilters={true} 
                      onTaskUpdated={handleTaskUpdated}
                      onCompleteTask={handleCompleteTask}
                      onJoinGroup={handleJoinGroup}
                      userGroups={userGroups || []}
                    />
                  }
                />
              ),
            },
            {
              key: 'invitations',
              label: (
                <span style={{ fontSize: 15 }}>
                  <MailOutlined /> 任务邀请
                  {invitationCount > 0 && (
                    <Badge count={invitationCount} style={{ marginLeft: 8 }} />
                  )}
                </span>
              ),
              children: (
                <TaskInvitationsList
                  invitations={invitations || []}
                  loading={invitationsLoading}
                  onInvitationUpdated={handleInvitationUpdated}
                  onViewTask={handleViewTaskDetail}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        task={selectedTask}
        visible={taskDetailDrawerVisible}
        onClose={() => setTaskDetailDrawerVisible(false)}
        onUpdateProgress={handleUpdateProgress}
        onCompleteTask={handleCompleteTask}
        onTaskUpdated={handleTaskUpdated}
        onTaskClick={handleTaskClick}
      />

      {/* 更新进度模态框 */}
      <TaskProgressModal
        visible={progressModalVisible}
        task={selectedTask}
        onClose={() => setProgressModalVisible(false)}
        onProgressUpdated={handleTaskUpdated}
      />

      {/* 群组加入模态框 */}
      <GroupJoinModal
        visible={groupJoinModalVisible}
        task={taskToConvert}
        userGroups={userGroups || []}
        onClose={() => {
          setGroupJoinModalVisible(false);
          setTaskToConvert(null);
        }}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};