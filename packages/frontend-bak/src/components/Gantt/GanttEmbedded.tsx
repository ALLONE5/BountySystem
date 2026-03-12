import React from 'react';
import { Spin } from 'antd';
import { Task } from '../../types';
import { GanttFilters } from './GanttFilters';
import { GanttChart } from './GanttChart';

interface GanttEmbeddedProps {
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

export const GanttEmbedded: React.FC<GanttEmbeddedProps> = ({
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
        <GanttFilters
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
    </>
  );
};