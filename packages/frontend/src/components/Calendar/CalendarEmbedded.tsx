import React from 'react';
import { Spin } from 'antd';
import { Task } from '../../types';
import { CalendarFilters } from './CalendarFilters';
import { CalendarView } from './CalendarView';

interface CalendarEmbeddedProps {
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

export const CalendarEmbedded: React.FC<CalendarEmbeddedProps> = ({
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
    <>
      <div style={{ 
        marginTop: 16,
        marginBottom: 16, 
        padding: '12px 16px',
        background: '#fafafa',
        borderRadius: '4px',
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <CalendarFilters
          groupByProject={groupByProject}
          searchText={searchText}
          statusFilter={statusFilter}
          onGroupByProjectChange={onGroupByProjectChange}
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          onRefresh={onRefresh}
        />
      </div>

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
    </>
  );
};