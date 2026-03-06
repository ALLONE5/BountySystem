import React, { useState } from 'react';
import { VisualizationTabs } from '../components/TaskVisualization/VisualizationTabs';

// Task Visualization Page with tabs for different views
export const TaskVisualizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gantt');

  return (
    <div style={{ padding: '24px' }}>
      <VisualizationTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};
