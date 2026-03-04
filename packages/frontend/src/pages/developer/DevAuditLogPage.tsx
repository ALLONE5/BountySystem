import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, DatePicker, Button, Space, message, Spin } from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import './DevAuditLogPage.css';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'error' | 'warning' | 'info';
  details: string;
  duration: number;
}

export const DevAuditLogPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    action: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // 模拟审计日志数据
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: dayjs().subtract(5, 'minute').toISOString(),
          userId: 'user1',
          userName: '张三',
          action: 'CREATE_TASK',
          resource: 'Task',
          resourceId: 'task123',
          method: 'POST',
          endpoint: '/api/tasks',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          details: '创建新任务: UI界面重构',
          duration: 245,
        },
        {
          id: '2',
          timestamp: dayjs().subtract(15, 'minute').toISOString(),
          userId: 'admin1',
          userName: '管理员',
          action: 'UPDATE_USER_ROLE',
          resource: 'User',
          resourceId: 'user456',
          method: 'PUT',
          endpoint: '/api/users/456/role',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          status: 'success',
          details: '更新用户角色: user -> position_admin',
          duration: 156,
        },
      ];

      setLogs(mockLogs);
    } catch (error) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.ipAddress.includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(log => {
        const logDate = dayjs(log.timestamp);
        return logDate.isAfter(start) && logDate.isBefore(end);
      });
    }

    setFilteredLogs(filtered);
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      'success': { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
      'error': { color: 'error', icon: <CloseCircleOutlined />, text: '错误' },
      'warning': { color: 'warning', icon: <ExclamationCircleOutlined />, text: '警告' },
      'info': { color: 'processing', icon: <InfoCircleOutlined />, text: '信息' },
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', icon: null, text: status };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
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
          <div style={{ fontWeight: 600 }}>{record.userName}</div>
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
          <div>{record.resource}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {record.resourceId}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => `${duration}ms`,
      sorter: (a, b) => a.duration - b.duration,
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
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

  const handleViewDetails = (_record: AuditLog) => {
    message.info('查看详情功能待实现');
  };

  const handleExport = () => {
    message.info('导出功能待实现');
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleActionFilter = (value: string) => {
    setFilters(prev => ({ ...prev, action: value }));
  };

  const handleDateRangeChange = (dates: any) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      action: '',
      dateRange: null,
    });
  };

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
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            onChange={handleStatusFilter}
            value={filters.status || undefined}
          >
            <Option value="success">成功</Option>
            <Option value="error">错误</Option>
            <Option value="warning">警告</Option>
            <Option value="info">信息</Option>
          </Select>

          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 150 }}
            onChange={handleActionFilter}
            value={filters.action || undefined}
          >
            <Option value="CREATE_TASK">创建任务</Option>
            <Option value="UPDATE_USER_ROLE">更新角色</Option>
            <Option value="DELETE_TASK">删除任务</Option>
            <Option value="LOGIN_FAILED">登录失败</Option>
            <Option value="SYSTEM_BACKUP">系统备份</Option>
          </Select>

          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            onChange={handleDateRangeChange}
            value={filters.dateRange}
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
          dataSource={filteredLogs}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSize: 50,
            pageSizeOptions: ['20', '50', '100', '200'],
          }}
          scroll={{ x: 1200 }}
          size="small"
          className="audit-logs-table"
        />
      </Card>
    </div>
  );
};

export default DevAuditLogPage;