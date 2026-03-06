/**
 * 任务搜索和过滤组件
 * 提供搜索、排序和分组功能
 */

import React from 'react';
import { Card, Row, Col, Input, Select } from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  GroupOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FlagOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

interface TaskSearchFiltersProps {
  searchKeyword: string;
  sortBy: 'bounty' | 'deadline' | 'priority' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  groupBy: 'none' | 'position' | 'tag' | 'complexity' | 'group' | 'projectGroup';
  onSearch: (value: string) => void;
  onSortByChange: (value: 'bounty' | 'deadline' | 'priority' | 'createdAt' | 'updatedAt') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onGroupByChange: (value: 'none' | 'position' | 'tag' | 'complexity' | 'group' | 'projectGroup') => void;
  onSearchKeywordChange: (value: string) => void;
}

export const TaskSearchFilters: React.FC<TaskSearchFiltersProps> = ({
  searchKeyword,
  sortBy,
  sortOrder,
  groupBy,
  onSearch,
  onSortByChange,
  onSortOrderChange,
  onGroupByChange,
  onSearchKeywordChange
}) => {
  return (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Search
            placeholder="搜索任务名称、描述或标签"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={onSearch}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            value={searchKeyword}
          />
        </Col>
        <Col xs={12} md={4}>
          <Select
            value={sortBy}
            onChange={onSortByChange}
            style={{ width: '100%' }}
            size="large"
            suffixIcon={<SortAscendingOutlined />}
          >
            <Option value="bounty">
              <DollarOutlined /> 按赏金
            </Option>
            <Option value="deadline">
              <ClockCircleOutlined /> 按截止日期
            </Option>
            <Option value="priority">
              <FlagOutlined /> 按优先级
            </Option>
            <Option value="createdAt">创建时间</Option>
            <Option value="updatedAt">更新时间</Option>
          </Select>
        </Col>
        <Col xs={12} md={4}>
          <Select
            value={sortOrder}
            onChange={onSortOrderChange}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="desc">降序</Option>
            <Option value="asc">升序</Option>
          </Select>
        </Col>
        <Col xs={24} md={4}>
          <Select
            value={groupBy}
            onChange={onGroupByChange}
            style={{ width: '100%' }}
            size="large"
            suffixIcon={<GroupOutlined />}
          >
            <Option value="none">不分组</Option>
            <Option value="position">按岗位</Option>
            <Option value="tag">按标签</Option>
            <Option value="complexity">按复杂度</Option>
            <Option value="group">按任务分组</Option>
            <Option value="projectGroup">按项目分组</Option>
          </Select>
        </Col>
      </Row>
    </Card>
  );
};