/**
 * 看板过滤器组件
 * 提供搜索、状态过滤和分组功能
 */

import React from 'react';
import { Space, Switch, Input, Select, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { TaskStatus } from '../../types';

const { Option } = Select;

interface KanbanFiltersProps {
  searchText: string;
  statusFilter: TaskStatus | 'all';
  groupByProject: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TaskStatus | 'all') => void;
  onGroupByProjectChange: (checked: boolean) => void;
  onRefresh: () => void;
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  searchText,
  statusFilter,
  groupByProject,
  onSearchChange,
  onStatusFilterChange,
  onGroupByProjectChange,
  onRefresh
}) => {
  return (
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
};