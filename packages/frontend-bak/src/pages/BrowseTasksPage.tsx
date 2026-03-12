import React, { useState } from 'react';
import { Typography } from 'antd';
import { taskApi } from '../api/task';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Task } from '../types';
import { TaskSearchFilters } from '../components/BrowseTasks/TaskSearchFilters';
import { TaskList } from '../components/BrowseTasks/TaskList';
import { TaskDetailModal } from '../components/BrowseTasks/TaskDetailModal';

const { Title, Text } = Typography;

export const BrowseTasksPage: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'bounty' | 'deadline' | 'priority' | 'createdAt' | 'updatedAt'>('bounty');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'position' | 'tag' | 'complexity' | 'group' | 'projectGroup'>('none');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const { handleAsyncError } = useErrorHandler();

  const pageSize = 50;

  // 使用 useDataFetch 加载任务数据
  const { loading, refetch } = useDataFetch(
    async () => {
      const data = await taskApi.browseTasks({
        sortBy,
        sortOrder,
        search: searchKeyword || undefined,
        page: 1,
        pageSize,
      });
      
      setAllTasks(data);
      setCurrentPage(1);
      setHasMore(data.length === pageSize);
      
      return data;
    },
    [sortBy, sortOrder, searchKeyword],
    {
      errorMessage: '加载任务列表失败',
      context: 'BrowseTasksPage.loadTasks'
    }
  );

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    
    await handleAsyncError(
      async () => {
        const data = await taskApi.browseTasks({
          sortBy,
          sortOrder,
          search: searchKeyword || undefined,
          page: nextPage,
          pageSize,
        });
        
        setAllTasks(prev => [...prev, ...data]);
        setCurrentPage(nextPage);
        setHasMore(data.length === pageSize);
      },
      'BrowseTasksPage.loadMore',
      undefined,
      '加载更多任务失败'
    );
  };

  const handleAcceptTask = async (taskId: string) => {
    await handleAsyncError(
      async () => {
        await taskApi.acceptTask(taskId);
        refetch();
        setDetailModalVisible(false);
      },
      'BrowseTasksPage.acceptTask',
      '任务承接成功',
      '承接任务失败'
    );
  };

  const handleViewDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>浏览赏金任务</Title>
          <Text type="secondary">发现并承接适合您的任务</Text>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <TaskSearchFilters
        searchKeyword={searchKeyword}
        sortBy={sortBy}
        sortOrder={sortOrder}
        groupBy={groupBy}
        onSearch={handleSearch}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onGroupByChange={setGroupBy}
        onSearchKeywordChange={setSearchKeyword}
      />

      {/* Task List */}
      <TaskList
        tasks={allTasks}
        groupBy={groupBy}
        loading={loading}
        hasMore={hasMore}
        onViewDetail={handleViewDetail}
        onAcceptTask={handleAcceptTask}
        onLoadMore={handleLoadMore}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={detailModalVisible}
        task={selectedTask}
        onClose={() => setDetailModalVisible(false)}
        onAcceptTask={handleAcceptTask}
      />
    </div>
  );
};