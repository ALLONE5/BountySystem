import React, { useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  DesktopOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

interface SystemMetrics {
  serverStatus: 'healthy' | 'warning' | 'error';
  databaseConnections: number;
  apiResponseTime: number;
  errorRate: number;
  uptime: string;
  memoryUsage: number;
}

export const DevSystemMonitorPage: React.FC = () => {
  const [metrics] = useState<SystemMetrics>({
    serverStatus: 'healthy',
    databaseConnections: 45,
    apiResponseTime: 120,
    errorRate: 0.02,
    uptime: '15天 8小时 32分钟',
    memoryUsage: 68,
  });

  return (
    <div className="dev-system-monitor">
      <h1>系统监控</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="服务器状态"
              value="正常"
              prefix={<DesktopOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="数据库连接"
              value={metrics.databaseConnections}
              prefix={<DatabaseOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="系统运行时间"
              value={metrics.uptime}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};