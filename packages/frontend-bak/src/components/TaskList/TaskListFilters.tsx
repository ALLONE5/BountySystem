/**
 * 任务列表过滤器组件
 * 处理搜索、状态过滤、分组等功能
 */

import React from 'react';
import { Card, Input, Select, Button, Switch, Space } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { TaskStatus } from '../../types';

const { Option } = Select;

interface TaskListFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | 'all';
  onStatusFilterChange: (value: TaskStatus | 'all') => void;
  groupByProject: boolean;
  onGroupByProjectChange: (checked: boolean) => void;
  onRefresh: () => void;
  hideCard?: boolean;
}

export const TaskListFilters: React.FC<TaskListFiltersProps> = ({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  groupByProject,
  onGroupByProjectChange,
  onRefresh,
  hideCard = false
}) => {
  const filterContent = (
    <Space size="middle">
      <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', fontWeight: 500 }}>
        按项目组分组:
        <Switch
          checked={groupByProject}
          onChange={onGroupByProjectChange}
          style={{ marginLeft: 8 }}
        />
      </span>
      <Input
        placeholder="搜索任务名称或描述"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={e => onSearchChange(e.target.value)}
        style={{ width: 250 }}
        allowClear
      />
      <Select
        value={statusFilter}
        onChange={onStatusFilterChange}
        style={{ width: 120 }}
      >
        <Option value="all">所有状态</Option>
        <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
        <Option value={TaskStatus.AVAILABLE}>可承接</Option>
        <Option value={TaskStatus.PENDING_ACCEPTANCE}>待接受</Option>
        <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
        <Option value={TaskStatus.COMPLETED}>已完成</Option>
      </Select>
      <Button icon={<ReloadOutlined />} onClick={onRefresh}>
        刷新
      </Button>
    </Space>
  );

  if (hideCard) {
    return (
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: '4px',
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        border: '1px solid var(--border-color)'
      }}>
        {filterContent}
      </div>
    );
  }

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>📝 列表视图</span>}
      extra={filterContent}
    />
  );
};