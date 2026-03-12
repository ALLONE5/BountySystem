/**
 * 任务列表容器组件
 * 管理任务列表的状态和业务逻辑
 */

import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { taskApi } from '../../api/task';
import { Task, TaskStatus } from '../../types';
import { TaskListFilters } from './TaskListFilters';
import { TaskListTable } from './TaskListTable';
import { TaskListGrouped } from './TaskListGrouped';
import { TaskDetailDrawer } from '../TaskDetailDrawer';
import { useAuth } from '../../contexts/AuthContext';
import { log } from '../../utils/logger';
import { message } from '../../utils/message';
import { logger } from '../../utils/logger';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

interface TaskListContainerProps {
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

export const TaskListContainer: React.FC<TaskListContainerProps> = ({
  tasks: propTasks,
  loading: propLoading,
  hideFilters,
  onTaskUpdated,
  ...actionProps
}) => {
  const { user } = useAuth();
  
  // Debug: Log user
  React.useEffect(() => {
    console.log('[TaskListContainer] User from authStore:', {
      user,
      userId: user?.id,
      hasUser: !!user
    });
  }, [user]);
  
  // Debug: Log received actionProps
  React.useEffect(() => {
    console.log('[TaskListContainer] Received actionProps:', {
      showAssignButton: actionProps.showAssignButton,
      onAssignTask: !!actionProps.onAssignTask,
      onPublishTask: !!actionProps.onPublishTask,
      onCompleteTask: !!actionProps.onCompleteTask,
      onEditTask: !!actionProps.onEditTask,
      onDeleteTask: !!actionProps.onDeleteTask,
      isPublishedTasksPage: actionProps.isPublishedTasksPage
    });
  }, [actionProps]);
  
  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  const tasks = propTasks || internalTasks;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  useEffect(() => {
    if (!propTasks) {
      loadTasks();
    }
  }, [propTasks]);

  useEffect(() => {
    applyFilters();
    if (tasks.length > 0) {
      log.debug('TaskListContainer tasks loaded', {
        totalTasks: tasks.length,
        tasksWithParent: tasks.filter(t => t.parentId).length,
        topLevelTasks: tasks.filter(t => !t.parentId).length
      });
    }
  }, [tasks, searchText, statusFilter]);

  useEffect(() => {
    if (selectedTask && drawerVisible) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        log.stateUpdate('TaskListContainer', { 
          selectedTaskId: selectedTask.id, 
          progress: updatedTask.progress 
        });
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id, drawerVisible]);

  useEffect(() => {
    if (groupByProject && filteredTasks.length > 0) {
      const projectNames = Array.from(new Set(filteredTasks.map(t => t.projectGroupName || '无项目组')));
      setExpandedProjects(projectNames);
    }
  }, [groupByProject, filteredTasks]);

  const loadTasks = async () => {
    try {
      setInternalLoading(true);
      const published = await taskApi.getPublishedTasks();
      const assigned = await taskApi.getAssignedTasks();
      const allTasks = [...published, ...assigned];

      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      setInternalTasks(uniqueTasks);
    } catch (error) {
      message.error('加载任务失败');
      logger.error('Failed to load tasks', { error });
    } finally {
      setInternalLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    filtered = filtered.filter(task => {
      if (task.parentId === null) {
        return true;
      }
      
      const parentTask = tasks.find(t => t.id === task.parentId);
      if (!parentTask) {
        return true;
      }
      
      return false;
    });

    if (searchText) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  };

  const getSubtaskCount = (taskId: string): number => {
    const subtasks = tasks.filter(t => t.parentId === taskId);
    const count = subtasks.length;
    if (count > 0) {
      log.debug('Task subtasks found', { 
        taskId, 
        subtaskCount: count,
        subtasks: subtasks.map(st => ({ id: st.id, name: st.name, parentId: st.parentId }))
      });
    }
    return count;
  };

  const handleCompleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '确定要完成这个任务吗？',
      content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await taskApi.completeTask(taskId);
          message.success('任务已完成');
          
          if (!propTasks) {
            await loadTasks();
          } else if (onTaskUpdated) {
            await onTaskUpdated();
          }
          
          setDrawerVisible(false);
        } catch (error) {
          message.error('完成任务失败');
          logger.error('Failed to complete task', { error });
          throw error;
        }
      },
    });
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Task> | SorterResult<Task>[]
  ) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerVisible(true);
  };

  const handleTaskClick = async (taskId: string) => {
    try {
      const task = await taskApi.getTask(taskId);
      setSelectedTask(task);
      setDrawerVisible(true);
    } catch (error) {
      message.error('加载任务详情失败');
      logger.error('Failed to load task details', { error });
    }
  };

  return (
    <>
      <TaskListFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        groupByProject={groupByProject}
        onGroupByProjectChange={setGroupByProject}
        onRefresh={loadTasks}
        hideCard={hideFilters}
      />

      {!groupByProject ? (
        <TaskListTable
          tasks={filteredTasks}
          loading={loading}
          tableParams={tableParams}
          onTableChange={handleTableChange}
          onTaskClick={handleViewTask}
          getSubtaskCount={getSubtaskCount}
          user={user}
          {...actionProps}
          onCompleteTask={actionProps.onCompleteTask || handleCompleteTask}
        />
      ) : (
        <TaskListGrouped
          tasks={filteredTasks}
          loading={loading}
          expandedProjects={expandedProjects}
          onExpandedProjectsChange={setExpandedProjects}
          onTaskClick={handleViewTask}
          getSubtaskCount={getSubtaskCount}
          user={user}
          {...actionProps}
          onCompleteTask={actionProps.onCompleteTask || handleCompleteTask}
        />
      )}

      <TaskDetailDrawer
        task={selectedTask}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onCompleteTask={handleCompleteTask}
        onTaskUpdated={onTaskUpdated}
        onTaskClick={handleTaskClick}
      />
    </>
  );
};