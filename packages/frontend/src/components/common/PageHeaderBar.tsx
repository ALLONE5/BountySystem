import React from 'react';
import { Typography } from 'antd';

interface PageHeaderBarProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  description?: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageHeaderBar: React.FC<PageHeaderBarProps> = ({
  title,
  actions,
  description,
  style,
}) => {
  return (
    <div
      className="page-header"
      style={{
        ...style,
      }}
    >
      <div>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description && (
          <Typography.Text type="secondary">{description}</Typography.Text>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
};
