import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Table,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  Tooltip,
  Drawer,
  Descriptions,
} from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
    dateRange: null as any,
    success: '',
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to load audit logs
      // const data = await auditApi.getLogs(filters);
      // setLogs(data.logs);
      
      // Mock data for demonstration
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId: 'admin-id',
          username: 'admin',
          action: 'CREATE_USER',
          resource: 'USER',
          resourceId: 'user-123',
          details: { username: 'newuser', email: 'newuser@example.com' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(),
          success: true,
        },
        {
          id: '2',
          userId: 'admin-id',
          username: 'admin',
          action: 'UPDATE_TASK',
          resource: 'TASK',
          resourceId: 'task-456',
          details: { field: 'status', oldValue: 'in_progress', newValue: 'completed' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 3600000),
          success: true,
        },
        {
          id: '3',
          userId: 'user-id',
          username: 'user1',
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          resourceId: '',
          details: { reason: 'Invalid password' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 7200000),
          success: false,
        },
      ];
      setLogs(mockLogs);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsVisible(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export audit logs');
  };

  const getActionColor = (action: string) => {
    const actionColors: Record<string, string> = {
      CREATE_USER: 'green',
      UPDATE_USER: 'blue',
      DELETE_USER: 'red',
      CREATE_TASK: 'green',
      UPDATE_TASK: 'blue',
      DELETE_TASK: 'red',
      LOGIN: 'cyan',
      LOGIN_FAILED: 'red',
      LOGOUT: 'default',
    };
    return actionColors[action] || 'default';
  };

  const getResourceColor = (resource: string) => {
    const resourceColors: Record<string, string> = {
      USER: 'blue',
      TASK: 'green',
      POSITION: 'orange',
      GROUP: 'purple',
      AUTH: 'cyan',
      SYSTEM: 'red',
    };
    return resourceColors[resource] || 'default';
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: Date) => (
        <Tooltip title={dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(timestamp).format('MM-DD HH:mm')}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username: string) => (
        <Text strong>{username}</Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{action}</Tag>
      ),
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 100,
      render: (resource: string) => (
        <Tag color={getResourceColor(resource)}>{resource}</Tag>
      ),
    },
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 120,
      ellipsis: true,
      render: (resourceId: string) => (
        <Text code style={{ fontSize: '12px' }}>{resourceId || '-'}</Text>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      width: 80,
      render: (success: boolean) => (
        <Tag color={success ? 'success' : 'error'}>
          {success ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record: AuditLog) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderBar
        title="审计日志"
        actions={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出日志
          </Button>
        }
      />

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索用户名或操作"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 200 }}
            allowClear
          />
          
          <Select
            placeholder="操作类型"
            value={filters.action}
            onChange={(value) => setFilters({ ...filters, action: value })}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="CREATE_USER">创建用户</Option>
            <Option value="UPDATE_USER">更新用户</Option>
            <Option value="DELETE_USER">删除用户</Option>
            <Option value="CREATE_TASK">创建任务</Option>
            <Option value="UPDATE_TASK">更新任务</Option>
            <Option value="DELETE_TASK">删除任务</Option>
            <Option value="LOGIN">登录</Option>
            <Option value="LOGIN_FAILED">登录失败</Option>
          </Select>

          <Select
            placeholder="资源类型"
            value={filters.resource}
            onChange={(value) => setFilters({ ...filters, resource: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="USER">用户</Option>
            <Option value="TASK">任务</Option>
            <Option value="POSITION">岗位</Option>
            <Option value="GROUP">组群</Option>
            <Option value="AUTH">认证</Option>
            <Option value="SYSTEM">系统</Option>
          </Select>

          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            style={{ width: 240 }}
          />

          <Select
            placeholder="状态"
            value={filters.success}
            onChange={(value) => setFilters({ ...filters, success: value })}
            style={{ width: 100 }}
            allowClear
          >
            <Option value="true">成功</Option>
            <Option value="false">失败</Option>
          </Select>
        </Space>
      </Card>

      {/* 日志表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="审计日志详情"
        placement="right"
        width={600}
        onClose={() => setDetailsVisible(false)}
        open={detailsVisible}
      >
        {selectedLog && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="日志ID">
                <Text code>{selectedLog.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                {selectedLog.username} ({selectedLog.userId})
              </Descriptions.Item>
              <Descriptions.Item label="操作">
                <Tag color={getActionColor(selectedLog.action)}>
                  {selectedLog.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源">
                <Tag color={getResourceColor(selectedLog.resource)}>
                  {selectedLog.resource}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源ID">
                <Text code>{selectedLog.resourceId || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedLog.ipAddress}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedLog.success ? 'success' : 'error'}>
                  {selectedLog.success ? '成功' : '失败'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                <Text style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {selectedLog.userAgent}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="详细信息">
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};