import React from 'react';
import { Card, Tabs } from 'antd';
import {
  BarChartOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { GanttChartPage } from '../../pages/GanttChartPage';
import { KanbanPage } from '../../pages/KanbanPage';
import { CalendarPage } from '../../pages/CalendarPage';
import { TaskListPage } from '../../pages/TaskListPage';

interface VisualizationTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const VisualizationTabs: React.FC<VisualizationTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabItems = [
    {
      key: 'gantt',
      label: (
        <span>
          <BarChartOutlined />
          甘特图
        </span>
      ),
      children: (
        <div style={{ marginTop: '16px' }}>
          <GanttChartPage hideFilters={true} />
        </div>
      )
    },
    {
      key: 'kanban',
      label: (
        <span>
          <AppstoreOutlined />
          看板
        </span>
      ),
      children: (
        <div style={{ marginTop: '16px' }}>
          <KanbanPage />
        </div>
      )
    },
    {
      key: 'calendar',
      label: (
        <span>
          <CalendarOutlined />
          日历
        </span>
      ),
      children: (
        <div style={{ marginTop: '16px' }}>
          <CalendarPage hideFilters={true} />
        </div>
      )
    },
    {
      key: 'list',
      label: (
        <span>
          <UnorderedListOutlined />
          列表
        </span>
      ),
      children: (
        <div style={{ marginTop: '16px' }}>
          <TaskListPage hideFilters={true} />
        </div>
      )
    }
  ];

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        size="large"
        tabBarStyle={{ marginBottom: 0 }}
        items={tabItems}
      />
    </Card>
  );
};