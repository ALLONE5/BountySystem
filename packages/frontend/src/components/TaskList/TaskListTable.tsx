/**
 * 任务列表表格组件
 * 处理任务数据的表格展示
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Table, Tag, Progress, Button, Badge, Modal, ConfigProvider } from 'antd';
import {
  DollarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  EditOutlined,
  TeamOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { Task, TaskStatus } from '../../types';
import { getTaskStatusConfig } from '../../utils/statusConfig';
import { fixedColumnFixer } from '../../utils/fixedColumnFix';
import { ultimateFixedColumnFixer } from '../../utils/ultimateFixedColumnFix';
import { tableFixedColumnUltimateFixer } from '../../utils/tableFixedColumnUltimateFix';
import dayjs from 'dayjs';

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

interface TaskListTableProps {
  tasks: Task[];
  loading: boolean;
  tableParams: TableParams;
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

export const TaskListTable: React.FC<TaskListTableProps> = ({
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

  // 强制修复固定列透明度的函数
  const forceFixFixedColumns = useCallback(() => {
    if (!tableRef.current) return;

    // 获取所有可能的固定列选择器
    const selectors = [
      '.ant-table-cell-fix-left',
      '.ant-table-cell-fix-right',
      'td.ant-table-cell-fix-left',
      'td.ant-table-cell-fix-right',
      'th.ant-table-cell-fix-left',
      'th.ant-table-cell-fix-right'
    ];

    selectors.forEach(selector => {
      const fixedCells = tableRef.current!.querySelectorAll(selector);
      
      fixedCells.forEach((cell) => {
        const element = cell as HTMLElement;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const isHovered = element.closest('tr')?.matches(':hover');
        
        let bgColor = '#ffffff';
        if (isDark) {
          bgColor = isHovered ? '#334155' : '#1e293b';
        } else {
          bgColor = isHovered ? '#f8fafc' : '#ffffff';
        }

        // 暴力设置所有背景相关属性
        element.style.setProperty('background', bgColor, 'important');
        element.style.setProperty('background-color', bgColor, 'important');
        element.style.setProperty('background-image', 'none', 'important');
        element.style.setProperty('backgroundColor', bgColor, 'important');
        
        // 暴力设置透明度相关属性
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('filter', 'none', 'important');
        element.style.setProperty('backdrop-filter', 'none', 'important');
        element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        element.style.setProperty('mix-blend-mode', 'normal', 'important');
        
        // 暴力设置定位相关属性
        element.style.setProperty('position', 'sticky', 'important');
        element.style.setProperty('z-index', '999999999', 'important');
        element.style.setProperty('isolation', 'isolate', 'important');

        // 创建超大阴影覆盖
        const shadowLayers = [
          `0 0 0 10000px ${bgColor}`,
          `inset 0 0 0 10000px ${bgColor}`,
          `0 -10000px 0 10000px ${bgColor}`,
          `0 10000px 0 10000px ${bgColor}`,
          `-10000px 0 0 10000px ${bgColor}`,
          `10000px 0 0 10000px ${bgColor}`
        ];
        element.style.setProperty('box-shadow', shadowLayers.join(', '), 'important');

        // 使用outline创建额外覆盖
        element.style.setProperty('outline', `10000px solid ${bgColor}`, 'important');
        element.style.setProperty('outline-offset', '-10000px', 'important');

        // 设置边框
        const borderColor = isDark ? '#374151' : '#e5e7eb';
        if (element.classList.contains('ant-table-cell-fix-left')) {
          element.style.setProperty('border-right', `2px solid ${borderColor}`, 'important');
        }
        if (element.classList.contains('ant-table-cell-fix-right')) {
          element.style.setProperty('border-left', `2px solid ${borderColor}`, 'important');
        }

        // 强制重绘
        element.style.setProperty('transform', 'translateZ(0) translate3d(0, 0, 0)', 'important');
        element.style.setProperty('will-change', 'auto', 'important');
        element.style.setProperty('backface-visibility', 'hidden', 'important');
        element.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');

        // 处理子元素
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          const childElement = child as HTMLElement;
          childElement.style.setProperty('position', 'relative', 'important');
          childElement.style.setProperty('z-index', '100', 'important');
          childElement.style.setProperty('background', 'transparent', 'important');
          childElement.style.setProperty('opacity', '1', 'important');
        });

        // 触发重绘
        element.offsetHeight;
      });
    });
  }, []);

  // 在组件挂载和数据变化时触发固定列修复
  useEffect(() => {
    const timer = setTimeout(() => {
      fixedColumnFixer.refresh();
      ultimateFixedColumnFixer.forceFixNow();
      tableFixedColumnUltimateFixer.forceFixNow();
      forceFixFixedColumns();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [tasks, loading, forceFixFixedColumns]);

  // 设置高频率的修复定时器
  useEffect(() => {
    const interval = setInterval(forceFixFixedColumns, 50); // 更高频率：50ms
    return () => clearInterval(interval);
  }, [forceFixFixedColumns]);

  // 监听鼠标事件以处理悬停状态
  useEffect(() => {
    const handleMouseEvents = () => {
      setTimeout(forceFixFixedColumns, 10);
    };

    if (tableRef.current) {
      tableRef.current.addEventListener('mouseover', handleMouseEvents);
      tableRef.current.addEventListener('mouseout', handleMouseEvents);
      
      return () => {
        if (tableRef.current) {
          tableRef.current.removeEventListener('mouseover', handleMouseEvents);
          tableRef.current.removeEventListener('mouseout', handleMouseEvents);
        }
      };
    }
  }, [forceFixFixedColumns]);

  const getPriorityColor = (priority: number): string => {
    if (priority >= 4) return 'red';
    if (priority >= 3) return 'orange';
    return 'blue';
  };

  const getComplexityText = (complexity: number): string => {
    const levels = ['极简', '简单', '中等', '复杂', '极难'];
    return levels[complexity - 1] || '未知';
  };

  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string, record: Task) => {
        const isPendingAcceptance = record.status === TaskStatus.PENDING_ACCEPTANCE;
        const subtaskCount = getSubtaskCount(record.id);
        
        return (
          <div 
            className={`task-name-cell ${isPendingAcceptance ? 'pending-acceptance' : ''}`}
            onClick={() => onTaskClick(record)}
          >
            <div className={`task-name-title ${isPendingAcceptance ? 'pending' : ''}`}>
              {isPendingAcceptance && <ClockCircleOutlined />}
              {text}
              {subtaskCount > 0 && (
                <Badge 
                  count={subtaskCount} 
                  className="subtask-badge"
                  title={`${subtaskCount}个子任务`}
                />
              )}
            </div>
            <div className="task-description">
              {record.description && record.description.length > 50
                ? record.description.substring(0, 50) + '...'
                : record.description || '无描述'}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status: TaskStatus) => {
        const statusConfig = getTaskStatusConfig(status);
        return (
          <Tag color={statusConfig.color} className="status-tag">
            {statusConfig.text}
          </Tag>
        );
      },
    },
    {
      title: '赏金',
      dataIndex: 'bountyAmount',
      key: 'bountyAmount',
      width: 120,
      sorter: (a, b) => (a.bountyAmount || 0) - (b.bountyAmount || 0),
      render: (amount: number) => (
        <Tag icon={<DollarOutlined />} className="bounty-tag">
          ${amount}
        </Tag>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      width: 150,
      sorter: (a, b) =>
        new Date(a.plannedEndDate || 0).getTime() - new Date(b.plannedEndDate || 0).getTime(),
      render: (date: Date) => (
        <div className="date-display">
          <ClockCircleOutlined />
          <span>{dayjs(date).format('YYYY-MM-DD')}</span>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: (a, b) => {
        const aPriority = typeof a.priority === 'number' ? a.priority : 0;
        const bPriority = typeof b.priority === 'number' ? b.priority : 0;
        return aPriority - bPriority;
      },
      render: (priority: number) => (
        <Tag icon={<FlagOutlined />} color={getPriorityColor(priority)} className="priority-tag">
          P{priority}
        </Tag>
      ),
    },
    {
      title: '复杂度',
      dataIndex: 'complexity',
      key: 'complexity',
      width: 100,
      sorter: (a, b) => (a.complexity || 0) - (b.complexity || 0),
      render: (complexity: number) => (
        <Tag className="task-tag">{getComplexityText(complexity)}</Tag>
      ),
    },
    {
      title: '预估工时',
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      width: 100,
      sorter: (a, b) => (a.estimatedHours || 0) - (b.estimatedHours || 0),
      render: (hours: number) => `${hours}h`,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      sorter: (a, b) => (a.progress || 0) - (b.progress || 0),
      render: (progress: number) => (
        <div className="progress-container">
          <Progress
            percent={progress}
            size="small"
            className="progress-bar"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <span className="progress-text">{progress}%</span>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div className="tags-container">
          {tags && tags.slice(0, 2).map(tag => (
            <Tag key={tag} className="task-tag">
              {tag}
            </Tag>
          ))}
          {tags && tags.length > 2 && (
            <Tag className="task-tag tags-more">+{tags.length - 2}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: Date) => (
        <div className="date-display">
          {dayjs(date).format('YYYY-MM-DD HH:mm')}
        </div>
      ),
    },
  ];

  // Add unified action column
  const hasActions = showAssignButton || showAcceptButton || onCompleteTask || onPublishTask || onEditTask || onJoinGroup || onDeleteTask;
  
  if (hasActions) {
    columns.push({
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const buttons: React.ReactNode[] = [];
        const isAssignee = user && record.assigneeId === user.id;
        const isPublisher = user && record.publisherId === user.id;
        const isPendingAcceptance = record.status === TaskStatus.PENDING_ACCEPTANCE;
        const isInProgress = record.status === TaskStatus.IN_PROGRESS;
        const isNotStarted = record.status === TaskStatus.NOT_STARTED;
        const canAssign = showAssignButton && !record.assigneeId && (
          record.status === TaskStatus.NOT_STARTED || 
          record.status === TaskStatus.AVAILABLE
        );
        const canAccept = showAcceptButton && !record.assigneeId && (
          record.status === TaskStatus.NOT_STARTED || 
          record.status === TaskStatus.AVAILABLE
        );
        const canPublish = onPublishTask && isPublisher && isNotStarted;
        const canDelete = onDeleteTask && isPublisher && (
          record.status === TaskStatus.NOT_STARTED || record.status === TaskStatus.AVAILABLE
        );

        // 发布按钮
        if (canPublish) {
          buttons.push(
            <Button
              key="publish"
              type="primary"
              size="small"
              icon={<SendOutlined />}
              className="action-btn action-btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onPublishTask(record);
              }}
            >
              发布
            </Button>
          );
        }

        // 编辑按钮（我的悬赏页面）
        if (isPublishedTasksPage && isPublisher && onEditTask) {
          buttons.push(
            <Button
              key="edit"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEditTask(record);
              }}
            >
              编辑
            </Button>
          );
        }

        // 待接受标签
        if (isPendingAcceptance) {
          buttons.push(
            <Tag key="pending" className="pending-tag" icon={<ClockCircleOutlined />}>
              待接受
            </Tag>
          );
        }

        // 指派按钮
        if (canAssign && onAssignTask) {
          buttons.push(
            <Button
              key="assign"
              type={isPublishedTasksPage ? "default" : "link"}
              size="small"
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAssignTask(record);
              }}
            >
              指派
            </Button>
          );
        }

        // 承接按钮
        if (canAccept && onAcceptTask) {
          buttons.push(
            <Button
              key="accept"
              type="primary"
              size="small"
              className="action-btn action-btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onAcceptTask(record.id);
              }}
            >
              承接
            </Button>
          );
        }

        // 完成任务按钮
        if (!isPublishedTasksPage && onCompleteTask) {
          const canComplete = isGroupTasksPage 
            ? isInProgress
            : (isAssignee && isInProgress);
          
          if (canComplete) {
            buttons.push(
              <Button
                key="complete"
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                className="action-btn action-btn-success"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteTask(record.id);
                }}
              >
                完成
              </Button>
            );
          }
        }

        // 群组按钮
        if (isAssignee && userGroups.length > 0 && onJoinGroup) {
          buttons.push(
            <Button
              key="joinGroup"
              size="small"
              icon={<TeamOutlined />}
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onJoinGroup(record);
              }}
            >
              群组
            </Button>
          );
        }

        // 编辑按钮（非我的悬赏页面）
        if (!isPublishedTasksPage && isPublisher && onEditTask) {
          buttons.push(
            <Button
              key="edit"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEditTask(record);
              }}
            >
              编辑
            </Button>
          );
        }

        // 删除按钮
        if (canDelete) {
          buttons.push(
            <Button
              key="delete"
              danger
              size="small"
              icon={<DeleteOutlined />}
              className="action-btn action-btn-danger"
              onClick={(e) => {
                e.stopPropagation();
                Modal.confirm({
                  title: '确定要删除这个任务吗？',
                  content: '删除后将无法恢复',
                  okText: '确定删除',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => onDeleteTask(record.id),
                });
              }}
            >
              删除
            </Button>
          );
        }

        return buttons.length > 0 ? <div className="action-buttons">{buttons}</div> : null;
      },
    });
  }

  return (
    <div ref={tableRef} className="task-table-wrapper">
      <ConfigProvider
        theme={{
          components: {
            Table: {
              // 强制设置表格背景
              headerBg: '#ffffff',
              bodySortBg: '#ffffff',
              rowHoverBg: '#f8fafc',
              colorBgContainer: '#ffffff',
              colorBgElevated: '#ffffff',
            } as any
          }
        }}
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={tableParams.pagination}
          onChange={onTableChange}
          onRow={(record) => ({
            onClick: () => onTaskClick(record),
          })}
          rowClassName={() => 'clickable-row'}
          scroll={{ x: 1500 }}
          size="small"
          className="task-table fixed-column-enhanced ultimate-fixed-table"
        />
      </ConfigProvider>
    </div>
  );
};