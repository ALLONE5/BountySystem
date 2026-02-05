import React from 'react';
import { Card, Row, Col } from 'antd';

/**
 * 骨架屏组件 - 用于加载状态展示
 */

interface SkeletonProps {
  type?: 'text' | 'title' | 'avatar' | 'button' | 'card' | 'list' | 'table' | 'dashboard';
  rows?: number;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  rows = 3,
  loading = true,
  children,
}) => {
  if (!loading && children) {
    return <>{children}</>;
  }

  if (!loading) {
    return null;
  }

  switch (type) {
    case 'text':
      return (
        <div>
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="skeleton skeleton-text"
              style={{ width: index === rows - 1 ? '60%' : '100%' }}
            />
          ))}
        </div>
      );

    case 'title':
      return <div className="skeleton skeleton-title" />;

    case 'avatar':
      return <div className="skeleton skeleton-avatar" />;

    case 'button':
      return <div className="skeleton skeleton-button" />;

    case 'card':
      return <div className="skeleton skeleton-card" />;

    case 'list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from({ length: rows }).map((_, index) => (
            <Card key={index} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="skeleton skeleton-avatar" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-title" style={{ width: '40%' }} />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );

    case 'table':
      return (
        <Card>
          <div className="skeleton skeleton-title" style={{ width: '30%', marginBottom: '16px' }} />
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: index < rows - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <div className="skeleton skeleton-avatar" style={{ width: '48px', height: '48px' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
              <div className="skeleton skeleton-button" />
            </div>
          ))}
        </Card>
      );

    case 'dashboard':
      return (
        <div>
          {/* 统计卡片骨架 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card>
                  <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '12px' }} />
                  <div className="skeleton skeleton-title" style={{ width: '70%' }} />
                </Card>
              </Col>
            ))}
          </Row>

          {/* 内容卡片骨架 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card>
                <div className="skeleton skeleton-title" style={{ marginBottom: '16px' }} />
                <div className="skeleton skeleton-card" style={{ height: '300px' }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card>
                <div className="skeleton skeleton-title" style={{ marginBottom: '16px' }} />
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} style={{ marginBottom: '12px' }}>
                    <div className="skeleton skeleton-text" />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </div>
      );

    default:
      return <div className="skeleton skeleton-text" />;
  }
};

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, index) => (
        <Col key={index} xs={24} sm={12} md={8} lg={6}>
          <Card>
            <div className="skeleton skeleton-avatar" style={{ marginBottom: '12px' }} />
            <div className="skeleton skeleton-title" style={{ marginBottom: '8px' }} />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

/**
 * 表格骨架屏
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return <Skeleton type="table" rows={rows} />;
};

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return <Skeleton type="list" rows={rows} />;
};

/**
 * 仪表盘骨架屏
 */
export const DashboardSkeleton: React.FC = () => {
  return <Skeleton type="dashboard" />;
};
