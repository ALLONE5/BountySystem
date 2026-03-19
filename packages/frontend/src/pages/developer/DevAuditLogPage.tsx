import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, DatePicker, Button, Space, Spin, Drawer, Descriptions, Typography } from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { auditLogApi, AuditLog, AuditLogFilters } from '../../api/auditLog';
import { message } from '../../utils/message';
import './DevAuditLogPage.css';
import { logger } from '../../utils/logger';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

export const DevAuditLogPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
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
      const data = await auditLogApi.getDevLogs({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      
      setLogs(data.data ?? []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
      }));
    } catch (error: any) {
      logger.error('Failed to load audit logs:', error);
      message.error('加载审计日志失败');
      
      // 如果是权限问题，显示友好提示
      if (error.response?.status === 403) {
        message.warning('当前用户暂无审计日志查看权限，请联系管理员');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (log: AuditLog) => {
    try {
      const detailedLog = await auditLogApi.getDevLogById(log.id);
      setSelectedLog(detailedLog);
      setDetailsVisible(true);
    } catch (error: any) {
      logger.error('Failed to load log details:', error);
      message.error('加载日志详情失败');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await auditLogApi.exportDevLogs(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dev_audit_logs_${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('审计日志导出成功');
    } catch (error: any) {
      logger.error('Failed to export logs:', error);
      if (error.response?.status === 403) {
        message.warning('当前用户暂无导出权限');
      } else {
        message.error('导出审计日志失败');
      }
    } finally {
      setLoading(false);
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

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      resource: '',
      success: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const getStatusTag = (success: boolean) => {
    return success ? (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        成功
      </Tag>
    ) : (
      <Tag color="error" icon={<CloseCircleOutlined />}>
        失败
      </Tag>
    );
  };

  const getActionTag = (action: string) => {
    const actionColors = {
      'CREATE': 'green',
      'UPDATE': 'blue',
      'DELETE': 'red',
      'LOGIN': 'purple',
      'LOGOUT': 'orange',
      'SYSTEM': 'cyan',
    };
    
    const actionType = action.split('_')[0];
    const color = actionColors[actionType as keyof typeof actionColors] || 'default';
    
    return <Tag color={color}>{action}</Tag>;
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
      width: 160,
      render: (timestamp) => (
        <div>
          <div>{dayjs(timestamp).format('YYYY-MM-DD')}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {dayjs(timestamp).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: '用户',
      key: 'user',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.username}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {record.userId}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: getActionTag,
    },
    {
      title: '资源',
      key: 'resource',
      width: 120,
      render: (_, record) => (
        <div>
          <Tag color={getResourceColor(record.resource)}>{record.resource}</Tag>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {record.resourceId || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      width: 100,
      render: getStatusTag,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: '详情',
      key: 'details',
      ellipsis: true,
      render: (_, record) => (
        <span style={{ fontSize: 12 }}>
          {typeof record.details === 'string' ? record.details : JSON.stringify(record.details)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dev-audit-log">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">审计日志</h1>
            <p className="page-subtitle">系统操作和安全事件的详细记录</p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadAuditLogs}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        </div>
      </div>

      {/* 过滤器 */}
      <Card className="filter-card">
        <Space wrap size="middle">
          <Search
            placeholder="搜索用户、操作、资源或IP地址"
            allowClear
            style={{ width: 300 }}
            onSearch={(value) => handleFilterChange('search', value)}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilterChange('success', value)}
            value={filters.success}
          >
            <Option value="true">成功</Option>
            <Option value="false">失败</Option>
          </Select>

          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('action', value)}
            value={filters.action || undefined}
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
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilterChange('resource', value)}
            value={filters.resource || undefined}
          >
            <Option value="USER">用户</Option>
            <Option value="TASK">任务</Option>
            <Option value="POSITION">岗位</Option>
            <Option value="GROUP">组群</Option>
            <Option value="AUTH">认证</Option>
            <Option value="SYSTEM">系统</Option>
          </Select>

          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            onChange={handleDateRangeChange}
          />

          <Button
            icon={<FilterOutlined />}
            onClick={clearFilters}
          >
            清除过滤
          </Button>
        </Space>
      </Card>

      {/* 日志表格 */}
      <Card className="logs-table-card">
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
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
          className="audit-logs-table"
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
                <Tag color={getActionTag(selectedLog.action).props.color}>
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

export default DevAuditLogPage;