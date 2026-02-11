import React from 'react';
import { useSystemConfig } from '../contexts/SystemConfigContext';

export const SystemConfigTest: React.FC = () => {
  const { config, loading } = useSystemConfig();

  // Only show debug panel if debug mode is enabled
  if (loading || !config?.debugMode) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: 10, 
      borderRadius: 4,
      fontSize: 12,
      zIndex: 9999,
      maxWidth: 300,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>System Config Debug</h4>
      <p style={{ margin: '4px 0' }}><strong>Site Name:</strong> {config?.siteName || 'Not loaded'}</p>
      <p style={{ margin: '4px 0' }}><strong>Logo URL:</strong> {config?.logoUrl || 'Not loaded'}</p>
      <p style={{ margin: '4px 0' }}><strong>Description:</strong> {config?.siteDescription || 'Not loaded'}</p>
      <p style={{ margin: '4px 0' }}><strong>Debug Mode:</strong> {config?.debugMode ? 'Enabled' : 'Disabled'}</p>
      <p style={{ margin: '4px 0' }}><strong>Page Title:</strong> {document.title}</p>
    </div>
  );
};