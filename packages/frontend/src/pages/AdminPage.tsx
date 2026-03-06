import React, { useState } from 'react';
import { AdminTabs } from '../components/admin/AdminTabs';
import { usePermission } from '../hooks/usePermission';

/**
 * 管理模块 - 整合所有管理功能
 */
export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { isSuperAdmin } = usePermission();

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSuperAdmin={isSuperAdmin()}
      />
    </div>
  );
};