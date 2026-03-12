import React, { useState } from 'react';
import { Tabs } from 'antd';
import {
  UnorderedListOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Task } from '../types';
import { GanttChartPage } from '../pages/GanttChartPage';
import { KanbanPage } from '../pages/KanbanPage';
import { CalendarPage } from '../pages/CalendarPage';

interface TaskViewsProps {
  tasks: Task[];
  loading: boolean;
  listView: React.ReactNode;
  activeTab?: string;
  onTabChange?: (key: string) => void;
  extra?: React.ReactNode;
}

export const TaskViews: React.FC<TaskViewsProps> = ({ 
  tasks, 
  loading, 
  listView,
  activeTab: controlledActiveTab,
  onTabChange,
  extra
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState('list');
  
  const activeTab = controlledActiveTab || internalActiveTab;
  const handleTabChange = (key: string) => {
    if (onTabChange) {
      onTabChange(key);
    } else {
      setInternalActiveTab(key);
    }
  };

  return (
    <Tabs
      activeKey={activeTab}
      onChange={handleTabChange}
      type="card"
      tabBarExtraContent={extra}
      items={[
        {
          key: 'list',
          label: (
            <span>
              <UnorderedListOutlined />
              列表
            </span>
          ),
          children: listView,
        },
        {
          key: 'gantt',
          label: (
            <span>
              <BarChartOutlined />
              甘特图
            </span>
          ),
          children: <div style={{ marginTop: -16 }}><GanttChartPage tasks={tasks} loading={loading} hideFilters /></div>,
        },
        {
          key: 'kanban',
          label: (
            <span>
              <AppstoreOutlined />
              看板
            </span>
          ),
          children: <div style={{ marginTop: -16 }}><KanbanPage tasks={tasks} loading={loading} hideFilters /></div>,
        },
        {
          key: 'calendar',
          label: (
            <span>
              <CalendarOutlined />
              日历
            </span>
          ),
          children: <div style={{ marginTop: -16 }}><CalendarPage tasks={tasks} loading={loading} hideFilters /></div>,
        },
      ]}
    />
  );
};
