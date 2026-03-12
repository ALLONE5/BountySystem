import React, { useState } from 'react';
import { MyTabs } from '../components/My/MyTabs';

/**
 * 我的模块 - 整合个人相关的所有功能
 */
export const MyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <MyTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};