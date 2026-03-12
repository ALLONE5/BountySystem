import React, { useState, useEffect } from 'react';
import { Card, Spin, Modal } from 'antd';
import { DropResult } from 'react-beautiful-dnd';
import { taskApi } from '../api/task';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Task, TaskStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { KanbanFilters } from '../components/Kanban/KanbanFilters';
import { KanbanBoard } from '../components/Kanban/KanbanBoard';
import { ProjectKanban } from '../components/Kanban/ProjectKanban';

interface KanbanPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
}

export const KanbanPage: React.FC<KanbanPageProps> = ({ 
  tasks: propTasks, 
  loading: propLoading, 
  hideFilters 
}) => {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const { handleAsyncError } = useErrorHandler();

  // 使用 useDataFetch 加载任务数据（仅在没有传入 propTasks 时）
  const { data: internalTasks = [], loading: internalLoading, refetch } = useDataFetch(
    async () => {
      const published = await taskApi.getPublishedTasks();
      const assigned = await taskApi.getAssignedTasks();
      const allTasks = [...published, ...assigned];

      // 去重
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      return uniqueTasks;
    },
    [],
    {
      immediate: !propTasks, // 只有在没有传入 propTasks 时才自动加载
      errorMessage: '加载任务失败',
      context: 'KanbanPage.loadTasks'
    }
  );

  const loading = propLoading !== undefined ? propLoading : internalLoading;
  const displayTasks = propTasks || internalTasks || [];

  // 应用过滤器
  useEffect(() => {
    let filtered = [...displayTasks];

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  }, [displayTasks, searchText, statusFilter]);

  // 初始化展开的项目
  useEffect(() => {
    if (groupByProject && filteredTasks.length > 0) {
      const projectNames = Array.from(new Set(filteredTasks.map(t => t.projectGroupName || '无项目组')));
      setExpandedProjects(projectNames);
    }
  }, [groupByProject, filteredTasks]);

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
            setDrawerVisible(false);
            if (!propTasks) {
              refetch();
            }
          },
          'KanbanPage.completeTask',
          '任务已完成',
          '完成任务失败'
        );
      },
    });
  };

  const handleTaskClick = async (task: Task) => {
    if (task.id) {
      await handleAsyncError(
        async () => {
          const fullTask = await taskApi.getTask(task.id);
          setSelectedTask(fullTask);
          setDrawerVisible(true);
        },
        'KanbanPage.loadTaskDetail',
        undefined,
        '加载任务详情失败'
      );
    } else {
      setSelectedTask(task);
      setDrawerVisible(true);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId.replace(/^.*-/, '') as TaskStatus;
    const task = displayTasks.find(t => t.id === draggableId);

    if (!task) {
      return;
    }

    await handleAsyncError(
      async () => {
        await taskApi.updateTask(draggableId, { status: newStatus });
        if (!propTasks) {
          refetch();
        }
      },
      'KanbanPage.updateTaskStatus',
      '任务状态已更新',
      '更新任务状态失败'
    );
  };

  const handleRefresh = () => {
    if (!propTasks) {
      refetch();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!groupByProject) {
      return (
        <KanbanBoard
          tasks={filteredTasks}
          onDragEnd={handleDragEnd}
          onTaskClick={handleTaskClick}
        />
      );
    }

    return (
      <ProjectKanban
        tasks={filteredTasks}
        expandedProjects={expandedProjects}
        onExpandedProjectsChange={setExpandedProjects}
        onDragEnd={handleDragEnd}
        onTaskClick={handleTaskClick}
      />
    );
  };

  const filtersComponent = (
    <KanbanFilters
      searchText={searchText}
      statusFilter={statusFilter}
      groupByProject={groupByProject}
      onSearchChange={setSearchText}
      onStatusFilterChange={setStatusFilter}
      onGroupByProjectChange={setGroupByProject}
      onRefresh={handleRefresh}
    />
  );

  return (
    <>
      {!hideFilters ? (
        <div style={{ padding: '24px' }}>
          <Card 
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>📋 看板视图</span>}
            extra={filtersComponent}
          >
            {renderContent()}
          </Card>
        </div>
      ) : (
        <>
          <div className="kanban-filters-wrapper" style={{ 
            marginTop: 16,
            marginBottom: 16, 
            padding: '12px 16px',
            borderRadius: '4px',
            display: 'flex', 
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {filtersComponent}
          </div>
          {renderContent()}
        </>
      )}

      <TaskDetailDrawer
        task={selectedTask}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onCompleteTask={handleCompleteTask}
      />
    </>
  );
};