import React, { useState } from 'react';
import { Typography, List, Button, Empty, Modal } from 'antd';
import { TeamOutlined, PlusOutlined } from '@ant-design/icons';
import { TaskGroup, Task } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { InviteMemberModal, UserOption } from '../components/common/InviteMemberModal';
import { GroupCard } from '../components/Groups/GroupCard';
import { GroupDetailDrawer } from '../components/Groups/GroupDetailDrawer';
import { CreateGroupModal } from '../components/Groups/CreateGroupModal';
import { CreateTaskModal } from '../components/Groups/CreateTaskModal';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuthStore } from '../store/authStore';
import { groupApi } from '../api/group';
import { userApi } from '../api/user';
import { taskApi } from '../api/task';

const { Title, Text } = Typography;

export const GroupsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);
  const [groupTasks, setGroupTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [taskDetailDrawerVisible, setTaskDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { handleAsyncError } = useErrorHandler();

  // 数据获取
  const { data: groups = [], loading, refetch: refetchGroups } = useDataFetch(
    () => groupApi.getUserGroups(),
    [],
    { errorMessage: '加载组群列表失败', context: 'GroupsPage.loadGroups' }
  );

  const handleViewGroup = async (group: TaskGroup) => {
    await handleAsyncError(
      async () => {
        setLoadingTasks(true);
        const [details, members, tasks] = await Promise.all([
          groupApi.getGroup(group.id),
          groupApi.getGroupMembers(group.id),
          groupApi.getGroupTasks(group.id),
        ]);

        console.log('[GroupsPage] Loaded group tasks:', tasks.length, 'tasks');
        console.log('[GroupsPage] Tasks with parentId:', tasks.filter(t => t.parentId).length);
        console.log('[GroupsPage] Top-level tasks:', tasks.filter(t => !t.parentId).length);

        setSelectedGroup({ ...details, members });
        setGroupTasks(tasks);
        setDrawerVisible(true);
      },
      'GroupsPage.viewGroup',
      undefined,
      '加载组群详情失败'
    );
    setLoadingTasks(false);
  };

  const handleCreateGroup = async (values: { name: string }) => {
    setCreateLoading(true);
    await handleAsyncError(
      async () => {
        await groupApi.createGroup(values.name);
        await refetchGroups();
      },
      'GroupsPage.createGroup',
      'Group created successfully',
      'Failed to create group'
    );
    setCreateLoading(false);
  };

  const handleInviteMember = async (userId: string) => {
    if (!selectedGroup) return;
    setInviteLoading(true);
    await handleAsyncError(
      async () => {
        await groupApi.inviteMember(selectedGroup.id, userId);
      },
      'GroupsPage.inviteMember',
      'Invitation sent successfully',
      'Failed to invite member'
    );
    setInviteLoading(false);
  };

  const handleSearchUsers = async (keyword: string): Promise<UserOption[]> => {
    if (!keyword) return [];
    try {
      const users = await userApi.searchUsers(keyword);
      return users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  const handleCreateTask = async (values: any) => {
    if (!selectedGroup) return;
    setCreateTaskLoading(true);
    await handleAsyncError(
      async () => {
        const taskData = {
          name: values.name,
          description: values.description,
          tags: values.tags || [],
          plannedStartDate: values.dateRange[0].toISOString(),
          plannedEndDate: values.dateRange[1].toISOString(),
          estimatedHours: values.estimatedHours,
          complexity: values.complexity,
          priority: values.priority,
        };

        await groupApi.createGroupTask(selectedGroup.id, taskData);
        
        // 刷新组群任务列表
        const tasks = await groupApi.getGroupTasks(selectedGroup.id);
        setGroupTasks(tasks);
      },
      'GroupsPage.createTask',
      '任务创建成功',
      '创建任务失败'
    );
    setCreateTaskLoading(false);
  };

  const handleAcceptTask = async (taskId: string) => {
    if (!selectedGroup) return;
    await handleAsyncError(
      async () => {
        await groupApi.acceptGroupTask(selectedGroup.id, taskId);
        
        // 刷新组群任务列表
        const tasks = await groupApi.getGroupTasks(selectedGroup.id);
        setGroupTasks(tasks);
      },
      'GroupsPage.acceptTask',
      '任务承接成功',
      '承接任务失败'
    );
  };

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
            
            // 刷新组群任务列表
            if (selectedGroup) {
              const tasks = await groupApi.getGroupTasks(selectedGroup.id);
              setGroupTasks(tasks);
            }
          },
          'GroupsPage.completeTask',
          '任务已完成',
          '完成任务失败'
        );
      },
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await handleAsyncError(
      async () => {
        await taskApi.deleteTask(taskId);
        
        // 刷新组群任务列表
        if (selectedGroup) {
          const tasks = await groupApi.getGroupTasks(selectedGroup.id);
          setGroupTasks(tasks);
        }
      },
      'GroupsPage.deleteTask',
      '任务已删除',
      '删除任务失败'
    );
  };

  const handleTaskUpdated = async () => {
    if (selectedGroup) {
      const tasks = await groupApi.getGroupTasks(selectedGroup.id);
      setGroupTasks(tasks);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTaskClick = async (taskId: string) => {
    await handleAsyncError(
      async () => {
        const task = await taskApi.getTask(taskId);
        setSelectedTask(task);
        setTaskDetailDrawerVisible(true);
      },
      'GroupsPage.taskClick',
      undefined,
      '加载任务详情失败'
    );
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> 我的组群
          </Title>
          <Text type="secondary">管理您的团队协作组群</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalVisible(true)}
        >
          创建组群
        </Button>
      </div>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
        dataSource={groups || []}
        locale={{ emptyText: <Empty description="暂无组群" /> }}
        renderItem={(group) => (
          <List.Item>
            <GroupCard group={group} onViewGroup={handleViewGroup} />
          </List.Item>
        )}
      />

      <GroupDetailDrawer
        visible={drawerVisible}
        group={selectedGroup}
        tasks={groupTasks}
        loadingTasks={loadingTasks}
        currentUserId={user?.id}
        onClose={() => setDrawerVisible(false)}
        onInviteMember={() => setInviteModalVisible(true)}
        onCreateTask={() => setCreateTaskModalVisible(true)}
        onAcceptTask={handleAcceptTask}
        onCompleteTask={handleCompleteTask}
        onDeleteTask={handleDeleteTask}
        onTaskUpdated={handleTaskUpdated}
      />

      <TaskDetailDrawer
        task={selectedTask}
        visible={taskDetailDrawerVisible}
        onClose={() => setTaskDetailDrawerVisible(false)}
        onTaskUpdated={handleTaskUpdated}
      />

      <CreateGroupModal
        visible={createModalVisible}
        loading={createLoading}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateGroup}
      />

      <InviteMemberModal
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        onSubmit={handleInviteMember}
        loading={inviteLoading}
        searchUsers={handleSearchUsers}
      />

      <CreateTaskModal
        visible={createTaskModalVisible}
        loading={createTaskLoading}
        onClose={() => setCreateTaskModalVisible(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};

export default GroupsPage;