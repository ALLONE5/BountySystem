import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Task } from '../types';
import { TaskViews } from '../components/TaskViews';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { TaskListPage } from './TaskListPage';
import { PublishedTasksStats } from '../components/PublishedTasks/PublishedTasksStats';
import { TaskEditModal } from '../components/PublishedTasks/TaskEditModal';
import { TaskAssignModal } from '../components/PublishedTasks/TaskAssignModal';
import { usePublishedTasksActions } from '../components/PublishedTasks/PublishedTasksActions';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { taskApi } from '../api/task';
import { positionApi } from '../api/position';
import { projectGroupApi } from '../api/projectGroup';

export const PublishedTasksPage: React.FC = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const { handleAsyncError } = useErrorHandler();

  // 数据获取
  const { data: tasks = [], loading, refetch: refetchTasks } = useDataFetch(
    () => taskApi.getPublishedTasks(),
    [],
    { errorMessage: '加载任务列表失败', context: 'PublishedTasksPage.loadTasks' }
  );

  const { data: positions = [] } = useDataFetch(
    () => positionApi.getAllPositions(),
    [],
    { errorMessage: '加载岗位列表失败', context: 'PublishedTasksPage.loadPositions' }
  );

  const { data: projectGroups = [], refetch: refetchProjectGroups } = useDataFetch(
    () => projectGroupApi.getAllProjectGroups(),
    [],
    { errorMessage: '加载项目分组失败', context: 'PublishedTasksPage.loadProjectGroups' }
  );

  // 任务操作
  const taskActions = usePublishedTasksActions({ 
    onTasksUpdate: async () => { 
      await refetchTasks(); 
    } 
  });

  const handleTaskUpdated = () => {
    refetchTasks();
  };

  // 定义所有处理函数（在 JSX 使用之前）
  const handleCreate = () => {
    setSelectedTask(null);
    setEditModalVisible(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setEditModalVisible(true);
  };

  const handleAssignTask = (task: Task) => {
    setAssigningTask(task);
    setAssignModalVisible(true);
  };

  const handleEditSubmit = async (taskData: any) => {
    await handleAsyncError(
      async () => {
        if (selectedTask) {
          await taskApi.updateTask(selectedTask.id, taskData);
        } else {
          await taskApi.createTask(taskData);
        }
        refetchTasks();
      },
      'PublishedTasksPage.handleEditSubmit',
      selectedTask ? '任务更新成功' : '任务创建成功',
      selectedTask ? '更新任务失败' : '创建任务失败'
    );
  };

  React.useEffect(() => {
    if (selectedTask && detailDrawerVisible && tasks) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask, detailDrawerVisible]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">我的悬赏</h1>
            <p className="page-description">管理您发布的所有任务</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            size="large"
          >
            创建任务
          </Button>
        </div>
      </div>

      <PublishedTasksStats tasks={tasks || []} />

      <TaskViews
        tasks={tasks || []}
        loading={loading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        listView={
          <TaskListPage 
            tasks={tasks || []} 
            loading={loading} 
            hideFilters={true} 
            onTaskUpdated={handleTaskUpdated}
            showAssignButton={true}
            onAssignTask={handleAssignTask}
            onPublishTask={taskActions.handlePublishTask}
            onCompleteTask={taskActions.handleCompleteTask}
            onEditTask={handleEdit}
            onDeleteTask={taskActions.handleDeleteTask}
            isPublishedTasksPage={true}
          />
        }
      />

      <TaskEditModal
        visible={editModalVisible}
        task={selectedTask}
        positions={positions as any[]}
        projectGroups={projectGroups as any[]}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        onProjectGroupsUpdate={async () => { 
          await refetchProjectGroups(); 
        }}
      />

      <TaskAssignModal
        visible={assignModalVisible}
        task={assigningTask}
        onClose={() => {
          setAssignModalVisible(false);
          setAssigningTask(null);
        }}
        onAssign={taskActions.handleAssignTask}
      />

      <TaskDetailDrawer
        task={selectedTask}
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default PublishedTasksPage;
