import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface InfoRowProps {
  label: React.ReactNode;
  children: React.ReactNode;
  labelWidth?: number;
  alignTop?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, children, labelWidth = 100, alignTop = true }) => {
  return (
    <div style={{ marginBottom: 12, display: 'flex', alignItems: alignTop ? 'flex-start' : 'center' }}>
      <Text strong style={{ minWidth: labelWidth, color: '#666' }}>{label}：</Text>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};
