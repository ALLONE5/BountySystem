import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import {
  BarChartOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { GanttChartPage } from './GanttChartPage';
import { KanbanPage } from './KanbanPage';
import { CalendarPage } from './CalendarPage';
import { TaskListPage } from './TaskListPage';

const { TabPane } = Tabs;

// Task Visualization Page with tabs for different views
export const TaskVisualizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gantt');

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 0 }}
        >
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                甘特图
              </span>
            }
            key="gantt"
          >
            <div style={{ marginTop: '16px' }}>
              <GanttChartPage hideFilters={true} />
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                看板
              </span>
            }
            key="kanban"
          >
            <div style={{ marginTop: '16px' }}>
              <KanbanPage />
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <CalendarOutlined />
                日历
              </span>
            }
            key="calendar"
          >
            <div style={{ marginTop: '16px' }}>
              <CalendarPage hideFilters={true} />
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <UnorderedListOutlined />
                列表
              </span>
            }
            key="list"
          >
            <div style={{ marginTop: '16px' }}>
              <TaskListPage hideFilters={true} />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
