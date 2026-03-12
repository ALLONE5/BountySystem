import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { taskApi } from '../api/task';
import { Task, TaskStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { CalendarContainer } from '../components/Calendar/CalendarContainer';
import { CalendarEmbedded } from '../components/Calendar/CalendarEmbedded';

interface CalendarPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ 
  tasks: propTasks, 
  loading: propLoading, 
  hideFilters 
}) => {
  const { handleAsyncError } = useErrorHandler();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Use internal data fetching if no props provided
  const { data: internalTasks, loading: internalLoading, refetch } = useDataFetch(
    async () => {
      const published = await taskApi.getPublishedTasks();
      const assigned = await taskApi.getAssignedTasks();
      const allTasks = [...published, ...assigned];
      
      // Remove duplicates
      return Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );
    },
    [],
    {
      immediate: !propTasks,
      errorMessage: '加载任务失败',
      context: 'CalendarPage.loadTasks'
    }
  );

  const tasks = propTasks || internalTasks || [];
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  useEffect(() => {
    applyFilters();
  }, [tasks, searchText, statusFilter]);

  // Initialize expanded projects when groupByProject is enabled
  useEffect(() => {
    if (groupByProject && filteredTasks.length > 0) {
      const projectNames = new Set(filteredTasks.map(t => t.projectGroupName || '无项目组'));
      setExpandedProjects(projectNames);
    }
  }, [groupByProject, filteredTasks]);

  const applyFilters = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDrawerVisible(true);
  };

  const handleProjectToggle = (projectName: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

  const handleCompleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '确定要完成这个任务吗？',
      content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await handleAsyncError(
          () => taskApi.completeTask(taskId),
          'CalendarPage.completeTask',
          '任务已完成',
          '完成任务失败'
        );
        setDrawerVisible(false);
        if (!propTasks) {
          refetch();
        }
      },
    });
  };

  return (
    <>
      {!hideFilters ? (
        <div style={{ padding: '24px' }}>
          <CalendarContainer
            loading={loading}
            filteredTasks={filteredTasks}
            groupByProject={groupByProject}
            searchText={searchText}
            statusFilter={statusFilter}
            expandedProjects={expandedProjects}
            onGroupByProjectChange={setGroupByProject}
            onSearchChange={setSearchText}
            onStatusFilterChange={setStatusFilter}
            onRefresh={refetch}
            onTaskClick={handleTaskClick}
            onProjectToggle={handleProjectToggle}
          />

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onCompleteTask={handleCompleteTask}
          />
        </div>
      ) : (
        <>
          <CalendarEmbedded
            loading={loading}
            filteredTasks={filteredTasks}
            groupByProject={groupByProject}
            searchText={searchText}
            statusFilter={statusFilter}
            expandedProjects={expandedProjects}
            onGroupByProjectChange={setGroupByProject}
            onSearchChange={setSearchText}
            onStatusFilterChange={setStatusFilter}
            onRefresh={refetch}
            onTaskClick={handleTaskClick}
            onProjectToggle={handleProjectToggle}
          />

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onCompleteTask={handleCompleteTask}
          />
        </>
      )}
    </>
  );
};
