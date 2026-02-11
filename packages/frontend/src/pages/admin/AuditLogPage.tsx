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
  message,
  Popconfirm,
} from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { auditLogApi, AuditLog, AuditLogFilters } from '../../api/auditLog';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    action: '',
    resource: '',
    success: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    loadAuditLogs();
  }, [filters, pagination.current, pagination.pageSize]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogApi.getLogs({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      
      setLogs(data.logs);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
      }));
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (log: AuditLog) => {
    try {
      const detailedLog = await auditLogApi.getLogById(log.id);
      setSelectedLog(detailedLog);
      setDetailsVisible(true);
    } catch (error: any) {
      console.error('Failed to load log details:', error);
      message.error('加载日志详情失败');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await auditLogApi.exportLogs(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('审计日志导出成功');
    } catch (error: any) {
      console.error('Failed to export logs:', error);
      message.error('导出审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      const result = await auditLogApi.cleanupOldLogs(365);
      message.success(`已删除 ${result.deletedCount} 条旧日志记录`);
      loadAuditLogs(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to cleanup logs:', error);
      message.error('清理旧日志失败');
    }
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: pagination.total,
    });
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({
      ...prev,
      current: 1, // Reset to first page when filtering
    }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
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
      render: (timestamp: string) => (
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
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={loading}
            >
              导出日志
            </Button>
            <Popconfirm
              title="确定要清理一年前的旧日志吗？"
              description="此操作不可撤销，将删除365天前的所有日志记录。"
              onConfirm={handleCleanup}
              okText="确定"
              cancelText="取消"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
              >
                清理旧日志
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索用户名或操作"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          
          <Select
            placeholder="操作类型"
            value={filters.action}
            onChange={(value) => handleFilterChange('action', value)}
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
            onChange={(value) => handleFilterChange('resource', value)}
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
            onChange={handleDateRangeChange}
            style={{ width: 240 }}
          />

          <Select
            placeholder="状态"
            value={filters.success}
            onChange={(value) => handleFilterChange('success', value)}
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
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="审计日志详情"
        placement="right"
        size="default"
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