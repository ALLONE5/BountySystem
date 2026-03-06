import React from 'react';
import { Card, Spin } from 'antd';
import { Task } from '../../types';
import { GanttFilters } from './GanttFilters';
import { GanttChart } from './GanttChart';

interface GanttContainerProps {
  loading: boolean;
  filteredTasks: Task[];
  groupByProject: boolean;
  searchText: string;
  statusFilter: any;
  expandedProjects: Set<string>;
  onGroupByProjectChange: (checked: boolean) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: any) => void;
  onRefresh: () => void;
  onTaskClick: (task: Task) => void;
  onProjectToggle: (projectName: string) => void;
}

export const GanttContainer: React.FC<GanttContainerProps> = ({
  loading,
  filteredTasks,
  groupByProject,
  searchText,
  statusFilter,
  expandedProjects,
  onGroupByProjectChange,
  onSearchChange,
  onStatusFilterChange,
  onRefresh,
  onTaskClick,
  onProjectToggle,
}) => {
  return (
    <Card 
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>📊 甘特图视图</span>}
      extra={
        <GanttFilters
          groupByProject={groupByProject}
          searchText={searchText}
          statusFilter={statusFilter}
          onGroupByProjectChange={onGroupByProjectChange}
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          onRefresh={onRefresh}
        />
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          暂无任务数据
        </div>
      ) : (
        <GanttChart
          filteredTasks={filteredTasks}
          groupByProject={groupByProject}
          expandedProjects={expandedProjects}
          onTaskClick={onTaskClick}
          onProjectToggle={onProjectToggle}
        />
      )}
    </Card>
  );
};