import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  DesktopOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { systemMonitorApi } from '../../api/systemMonitor';
import { logger } from '../../utils/logger';
import { message } from '../../utils/message';

interface SystemMetrics {
  serverStatus: 'healthy' | 'warning' | 'error';
  databaseConnections: number;
  apiResponseTime: number;
  errorRate: number;
  uptime: string;
  memoryUsage: number;
}

export const DevSystemMonitorPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    serverStatus: 'healthy',
    databaseConnections: 0,
    apiResponseTime: 0,
    errorRate: 0,
    uptime: '0分钟',
    memoryUsage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemMetrics();
    // 设置定时刷新
    const interval = setInterval(loadSystemMetrics, 10000); // 10秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);
      
      // 并行获取性能和数据库信息
      const [performance, database] = await Promise.all([
        systemMonitorApi.getPerformance(),
        systemMonitorApi.getDatabase()
      ]);

      setMetrics({
        serverStatus: database.status === 'healthy' ? 'healthy' : 'warning',
        databaseConnections: database.connections,
        apiResponseTime: database.responseTime,
        errorRate: 0.02, // 暂时使用固定值
        uptime: performance.uptime,
        memoryUsage: performance.memoryUsage,
      });
      
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load system metrics:', error);
      message.error('加载系统监控数据失败');
      setLoading(false);
    }
  };

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
          <Card loading={loading}>
            <Statistic
              title="API响应时间"
              value={metrics.apiResponseTime}
              suffix="ms"
              prefix={<DatabaseOutlined />}
              styles={{ content: { color: metrics.apiResponseTime > 200 ? '#faad14' : '#52c41a' } }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="内存使用率"
              value={metrics.memoryUsage}
              suffix="%"
              prefix={<DesktopOutlined />}
              styles={{ content: { color: metrics.memoryUsage > 80 ? '#f5222d' : '#1890ff' } }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};