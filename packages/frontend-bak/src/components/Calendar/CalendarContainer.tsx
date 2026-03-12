import React from 'react';
import { Card, Spin } from 'antd';
import { Task } from '../../types';
import { CalendarFilters } from './CalendarFilters';
import { CalendarView } from './CalendarView';

interface CalendarContainerProps {
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

export const CalendarContainer: React.FC<CalendarContainerProps> = ({
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
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>📅 日历视图</span>}
      extra={
        <CalendarFilters
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
      ) : (
        <CalendarView
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