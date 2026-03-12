/**
 * 完全自定义的表格组件
 * 彻底解决固定列透明度问题
 */

import React, { useState, useRef, useEffect } from 'react';
import { Tag, Progress, Button, Badge, Modal, Spin } from 'antd';
import {
  DollarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  EditOutlined,
  TeamOutlined,
  DeleteOutlined,
  SendOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { Task, TaskStatus } from '../../types';
import { getTaskStatusConfig } from '../../utils/statusConfig';
import dayjs from 'dayjs';
import './CustomTable.css';

interface CustomTableProps {
  tasks: Task[];
  loading: boolean;
  tableParams: {
    pagination?: TablePaginationConfig;
    sortField?: string;
    sortOrder?: string;
    filters?: Record<string, FilterValue | null>;
  };
  onTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Task> | SorterResult<Task>[]
  ) => void;
  onTaskClick: (task: Task) => void;
  getSubtaskCount: (taskId: string) => number;
  
  // Action props
  user?: any;
  userGroups?: any[];
  showAssignButton?: boolean;
  showAcceptButton?: boolean;
  isPublishedTasksPage?: boolean;
  isGroupTasksPage?: boolean;
  
  // Action callbacks
  onAssignTask?: (task: Task) => void;
  onAcceptTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onPublishTask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onJoinGroup?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

interface SortState {
  field: string | null;
  order: 'asc' | 'desc' | null;
}

export const CustomTable: React.FC<CustomTableProps> = ({
  tasks,
  loading,
  tableParams,
  onTableChange,
  onTaskClick,
  getSubtaskCount,
  user,
  userGroups = [],
  showAssignButton = false,
  showAcceptButton = false,
  isPublishedTasksPage = false,
  isGroupTasksPage = false,
  onAssignTask,
  onAcceptTask,
  onCompleteTask,
  onPublishTask,
  onEditTask,
  onJoinGroup,
  onDeleteTask
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [sortState, setSortState] = useState<SortState>({ field: null, order: null });

  const getPriorityColor = (priority: number): string => {
    if (priority >= 4) return 'red';
    if (priority >= 3) return 'orange';
    return 'blue';
  };

  const getComplexityText = (complexity: number): string => {
    const levels = ['极简', '简单', '中等', '复杂', '极难'];
    return levels[complexity - 1] || '未知';
  };

  const handleSort = (field: string) => {
    let newOrder: 'asc' | 'desc' | null = 'asc';
    
    if (sortState.field === field) {
      if (sortState.order === 'asc') {
        newOrder = 'desc';
      } else if (sortState.order === 'desc') {
        newOrder = null;
      }
    }

    setSortState({ field: newOrder ? field : null, order: newOrder });

    // 触发排序回调
    const sorter: SorterResult<Task> = {
      field: newOrder ? field : undefined,
      order: newOrder === 'asc' ? 'ascend' : newOrder 