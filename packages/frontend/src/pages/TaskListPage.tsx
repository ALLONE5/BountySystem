import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, Button, Select, Input, Space, message, Switch, Collapse, Badge, Modal } from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  TeamOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { taskApi } from '../api/task';
import { Task, TaskStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;
const { Panel } = Collapse;

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Record<string, FilterValue | null>;
}

interface TaskListPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
  onTaskUpdated?: () => void;
  showAssignButton?: boolean;
  onAssignTask?: (task: Task) => void;
  showAcceptButton?: boolean;
  onAcceptTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onAbandonTask?: (taskId: string) => void;
  onPublishTask?: (task: Task) => void; // 新增发布回调
  onEditTask?: (task: Task) => void;
  onJoinGroup?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void; // 新增删除回调
  userGroups?: any[];
  isPublishedTasksPage?: boolean; // 标识是否为"我的悬赏"页面
  isGroupTasksPage?: boolean; // 标识是否为组群任务页面
}

export const TaskListPage: React.FC<TaskListPageProps> = ({ 
  tasks: propTasks, 
  loading: propLoading, 
  hideFilters, 
  onTaskUpdated,
  showAssignButton = false,
  onAssignTask,
  showAcceptButton = false,
  onAcceptTask,
  onCompleteTask,
  onAbandonTask,
  onPublishTask, // 新增
  onEditTask,
  onJoinGroup,
  onDeleteTask, // 新增
  userGroups = [],
  isPublishedTasksPage = false,
  isGroupTasksPage = false, // 新增
}) => {
  console.log('TaskListPage rendered, hideFilters:', hideFilters);
  const { user } = useAuthStore();
  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  const tasks = propTasks || internalTasks;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  useEffect(() => {
    if (!propTasks) {
      loadTasks();
    }
  }, [propTasks]);

  useEffect(() => {
    applyFilters();
    if (tasks.length > 0) {
      console.log('[TaskListPage] Total tasks:', tasks.length);
      console.log('[TaskListPage] Tasks with parentId:', tasks.filter(t => t.parentId).map(t => ({ id: t.id, name: t.name, parentId: t.parentId })));
      console.log('[TaskListPage] Top-level tasks:', tasks.filter(t => !t.parentId).length);
    }
  }, [tasks, searchText, statusFilter]);

  // Update selected task when tasks array changes
  useEffect(() => {
    if (selectedTask && drawerVisible) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        console.log('[TaskListPage] Updating selectedTask with new data, progress:', updatedTask.progress);
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id, drawerVisible]);

  // Initialize expanded projects when groupByProject is enabled
  useEffect(() => {
    if (groupByProject && filteredTasks.length > 0) {
      const projectNames = Array.from(new Set(filteredTasks.map(t => t.projectGroupName || '无项目组')));
      setExpandedProjects(projectNames);
    }
  }, [groupByProject, filteredTasks]);

  const loadTasks = async () => {
    try {
      setInternalLoading(true);
      const published = await taskApi.getPublishedTasks();
      const assigned = await taskApi.getAssignedTasks();
      const allTasks = [...published, ...assigned];

      // Remove duplicates
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      setInternalTasks(uniqueTasks);
    } catch (error) {
      message.error('加载任务失败');
      console.error(error);
    } finally {
      setInternalLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // 只显示顶层任务，或者父任务不属于当前用户的子任务
    // 这样可以正确显示所有应该显示的任务，同时保留子任务数据用于计算
    filtered = filtered.filter(task => {
      if (task.parentId === null) {
        // 顶层任务，始终显示
        return true;
      }
      
      // 子任务：检查父任务是否在任务列表中
      const parentTask = tasks.find(t => t.id === task.parentId);
      if (!parentTask) {
        // 父任务不在列表中，显示这个子任务
        return true;
      }
      
      // 父任务在列表中，不显示这个子任务（它会作为父任务的子任务显示）
      return false;
    });

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          task.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  };

  // 计算每个任务的子任务数量
  const getSubtaskCount = (taskId: string): number => {
    const subtasks = tasks.filter(t => t.parentId === taskId);
    const count = subtasks.length;
    if (count > 0) {
      console.log(`[TaskListPage] Task ${taskId} has ${count} subtasks:`, subtasks.map(st => ({ id: st.id, name: st.name, parentId: st.parentId })));
    }
    return count;
  };

  const handleAbandonTask = async (taskId: string) => {
    try {
      await taskApi.abandonTask(taskId);
      message.success('任务已放弃');
      setDrawerVisible(false);
      if (!propTasks) {
        loadTasks();
      }
    } catch (error) {
      message.error('放弃任务失败');
      console.error('Failed to abandon task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '确定要完成这个任务吗？',
      content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await taskApi.completeTask(taskId);
          message.success('任务已完成');
          
          // 刷新任务列表
          if (!propTasks) {
            await loadTasks();
          } else if (onTaskUpdated) {
            await onTaskUpdated();
          }
          
          // 关闭抽屉
          setDrawerVisible(false);
        } catch (error) {
          message.error('完成任务失败');
          console.error('Failed to complete task:', error);
          throw error; // 让 Modal 知道操作失败
        }
      },
    });
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'default';
      case TaskStatus.AVAILABLE:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'processing';
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.ABANDONED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return '未开始';
      case TaskStatus.AVAILABLE:
        return '可承接';
      case TaskStatus.IN_PROGRESS:
        return '进行中';
      case TaskStatus.COMPLETED:
        return '已完成';
      case TaskStatus.ABANDONED:
        return '已放弃';
      default:
        return '未知';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 4) return 'red';
    if (priority >= 3) return 'orange';
    return 'blue';
  };

  const getComplexityText = (complexity: number): string => {
    const levels = ['极简', '简单', '中等', '复杂', '极难'];
    return levels[complexity - 1] || '未知';
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Task> | SorterResult<Task>[]
  ) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerVisible(true);
  };

  const handleTaskClick = async (taskId: string) => {
    try {
      const task = await taskApi.getTask(taskId);
      setSelectedTask(task);
      setDrawerVisible(true);
    } catch (error) {
      message.error('加载任务详情失败');
      console.error(error);
    }
  };

  // Group tasks by project
  const groupTasksByProject = (): Record<string, Task[]> => {
    const grouped: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      const key = task.projectGroupName || '无项目组';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });
    return grouped;
  };

  // Calculate project statistics
  const getProjectStats = (tasks: Task[]) => {
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const totalBounty = tasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0);
    return { inProgress, completed, totalBounty };
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
            style={{ 
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              backgroundColor: isPendingAcceptance ? '#fff7e6' : 'transparent',
              border: isPendingAcceptance ? '1px solid #ffd591' : 'none'
            }} 
            onClick={() => handleViewTask(record)}
          >
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '4px', 
              color: isPendingAcceptance ? '#fa8c16' : '#1890ff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {isPendingAcceptance && <ClockCircleOutlined />}
              {text}
              {subtaskCount > 0 && (
                <Badge 
                  count={subtaskCount} 
                  style={{ 
                    backgroundColor: '#52c41a',
                  }} 
                  title={`${subtaskCount}个子任务`}
                />
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.description.length > 50
                ? record.description.substring(0, 50) + '...'
                : record.description}
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
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '赏金',
      dataIndex: 'bountyAmount',
      key: 'bountyAmount',
      width: 120,
      sorter: (a, b) => a.bountyAmount - b.bountyAmount,
      render: (amount: number) => (
        <Tag icon={<DollarOutlined />} color="gold">
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
        new Date(a.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime(),
      render: (date: Date) => (
        <Space>
          <ClockCircleOutlined />
          <span>{dayjs(date).format('YYYY-MM-DD')}</span>
        </Space>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: (a, b) => a.priority - b.priority,
      render: (priority: number) => (
        <Tag icon={<FlagOutlined />} color={getPriorityColor(priority)}>
          P{priority}
        </Tag>
      ),
    },
    {
      title: '复杂度',
      dataIndex: 'complexity',
      key: 'complexity',
      width: 100,
      sorter: (a, b) => a.complexity - b.complexity,
      render: (complexity: number) => (
        <Tag>{getComplexityText(complexity)}</Tag>
      ),
    },
    {
      title: '预估工时',
      dataIndex: 'estimatedHours',
      key: 'estimatedHours',
      width: 100,
      sorter: (a, b) => a.estimatedHours - b.estimatedHours,
      render: (hours: number) => `${hours}h`,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      sorter: (a, b) => a.progress - b.progress,
      render: (progress: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Progress
            percent={progress}
            size="small"
            style={{ flex: 1, margin: 0 }}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <span style={{ fontSize: '12px', minWidth: '40px' }}>{progress}%</span>
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <>
          {tags && tags.slice(0, 2).map(tag => (
            <Tag key={tag} style={{ marginBottom: '4px' }}>
              {tag}
            </Tag>
          ))}
          {tags && tags.length > 2 && (
            <Tag style={{ marginBottom: '4px' }}>+{tags.length - 2}</Tag>
          )}
        </>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  // Add unified action column
  const hasActions = showAssignButton || showAcceptButton || onCompleteTask || onAbandonTask || onPublishTask || onEditTask || onJoinGroup || onDeleteTask;
  
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
        // 发布按钮逻辑 - 只在"我的悬赏"页面显示，且任务状态为未开始
        const canPublish = onPublishTask && isPublisher && isNotStarted;
        
        // 删除按钮逻辑
        // 发布者只能删除未开始和可承接状态的任务（与普通任务保持一致）
        const canDelete = onDeleteTask && isPublisher && (
          record.status === TaskStatus.NOT_STARTED || record.status === TaskStatus.AVAILABLE
        );

        // 发布按钮 - 在"我的悬赏"页面最前面
        if (canPublish) {
          buttons.push(
            <Button
              key="publish"
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onPublishTask(record);
              }}
            >
              发布
            </Button>
          );
        }

        // 如果是"我的悬赏"页面，编辑按钮放在发布按钮后面
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
            <Tag key="pending" color="warning" icon={<ClockCircleOutlined />}>
              待接受
            </Tag>
          );
        }

        // 指派按钮 - 在"我的悬赏"页面使用同风格按钮
        if (canAssign && onAssignTask) {
          buttons.push(
            <Button
              key="assign"
              type={isPublishedTasksPage ? "default" : "link"}
              size="small"
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
              onClick={(e) => {
                e.stopPropagation();
                onAcceptTask(record.id);
              }}
            >
              承接
            </Button>
          );
        }

        // 完成任务按钮 - 在"我的悬赏"页面不显示
        // 在组群任务页面，所有组群成员都可以完成任务
        if (!isPublishedTasksPage && onCompleteTask) {
          const canComplete = isGroupTasksPage 
            ? isInProgress // 组群任务：任何成员都可以完成进行中的任务
            : (isAssignee && isInProgress); // 普通任务：只有承接者可以完成
          
          if (canComplete) {
            buttons.push(
              <Button
                key="complete"
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
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

        // 放弃任务按钮 - 在"我的悬赏"页面不显示
        // 在组群任务页面，所有组群成员都可以放弃任务
        if (!isPublishedTasksPage && onAbandonTask) {
          const canAbandon = isGroupTasksPage 
            ? isInProgress // 组群任务：任何成员都可以放弃进行中的任务
            : (isAssignee && isInProgress); // 普通任务：只有承接者可以放弃
          
          if (canAbandon) {
            buttons.push(
              <Button
                key="abandon"
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  Modal.confirm({
                    title: '确定要放弃这个任务吗？',
                    content: '放弃后任务将恢复为未承接状态',
                    onOk: () => onAbandonTask(record.id),
                  });
                }}
              >
                放弃
              </Button>
            );
          }
        }

        // 群组按钮（承接者可以查看或加入群组）
        if (isAssignee && userGroups.length > 0 && onJoinGroup) {
          buttons.push(
            <Button
              key="joinGroup"
              size="small"
              icon={<TeamOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onJoinGroup(record);
              }}
            >
              群组
            </Button>
          );
        }

        // 编辑按钮 - 在非"我的悬赏"页面放在最后
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

        // 删除按钮 - 只有发布者可见，且只能删除未开始和可承接状态的任务
        if (canDelete) {
          buttons.push(
            <Button
              key="delete"
              danger
              size="small"
              icon={<DeleteOutlined />}
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

        return buttons.length > 0 ? <Space size="small">{buttons}</Space> : null;
      },
    });
  }

  return (
    <>
      {!hideFilters && (
        <div style={{ padding: '24px' }}>
          <Card
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>📝 列表视图</span>}
            extra={
              <Space size="middle">
                <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                  按项目组分组:
                  <Switch
                    checked={groupByProject}
                    onChange={setGroupByProject}
                    style={{ marginLeft: 8 }}
                  />
                </span>
                <Input
                  placeholder="搜索任务名称或描述"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  allowClear
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 120 }}
                >
                  <Option value="all">所有状态</Option>
                  <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
                  <Option value={TaskStatus.AVAILABLE}>可承接</Option>
                  <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
                  <Option value={TaskStatus.COMPLETED}>已完成</Option>
                  <Option value={TaskStatus.ABANDONED}>已放弃</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={loadTasks}>
                  刷新
                </Button>
              </Space>
            }
          >
            {!groupByProject ? (
              <Table
                columns={columns}
                dataSource={filteredTasks}
                rowKey="id"
                loading={loading}
                pagination={tableParams.pagination}
                onChange={handleTableChange}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedTask(record);
                    setDrawerVisible(true);
                  },
                })}
                rowClassName={() => 'clickable-row'}
                scroll={{ x: 1500 }}
                size="small"
              />
            ) : (
              <Collapse
                activeKey={expandedProjects}
                onChange={(keys) => setExpandedProjects(keys as string[])}
                style={{ background: 'transparent', border: 'none' }}
              >
                {Object.entries(groupTasksByProject()).map(([projectName, projectTasks]) => {
                  const stats = getProjectStats(projectTasks);
                  return (
                    <Panel
                      key={projectName}
                      header={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Space>
                            <FolderOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{projectName}</span>
                            <Badge count={projectTasks.length} style={{ backgroundColor: '#722ed1' }} />
                          </Space>
                          <Space size="large" onClick={(e) => e.stopPropagation()}>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              {stats.inProgress} 进行中
                            </span>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              {stats.completed} 已完成
                            </span>
                            <span style={{ fontSize: 13, color: '#f5222d', fontWeight: 600 }}>
                              ${stats.totalBounty.toFixed(2)}
                            </span>
                          </Space>
                        </div>
                      }
                      style={{
                        marginBottom: 16,
                        background: '#fff',
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                      }}
                    >
                      <Table
                        columns={columns}
                        dataSource={projectTasks}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        onRow={(record) => ({
                          onClick: () => {
                            setSelectedTask(record);
                            setDrawerVisible(true);
                          },
                        })}
                        rowClassName={() => 'clickable-row'}
                        scroll={{ x: 1500 }}
                        size="small"
                      />
                    </Panel>
                  );
                })}
              </Collapse>
            )}
          </Card>

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onAbandonTask={handleAbandonTask}
            onCompleteTask={handleCompleteTask}
            onTaskUpdated={onTaskUpdated}
            onTaskClick={handleTaskClick}
          />
        </div>
      )}

      {hideFilters && (
        <>
          <div style={{ 
            marginBottom: 16, 
            padding: '12px 16px',
            background: '#fafafa',
            borderRadius: '4px',
            display: 'flex', 
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <Space size="middle">
              <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                按项目组分组:
                <Switch
                  checked={groupByProject}
                  onChange={setGroupByProject}
                  style={{ marginLeft: 8 }}
                />
              </span>
              <Input
                placeholder="搜索任务名称或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
              >
                <Option value="all">所有状态</Option>
                <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
                <Option value={TaskStatus.AVAILABLE}>可承接</Option>
                <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
                <Option value={TaskStatus.COMPLETED}>已完成</Option>
                <Option value={TaskStatus.ABANDONED}>已放弃</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={loadTasks}>
                刷新
              </Button>
            </Space>
          </div>

          {!groupByProject ? (
            <Table
              columns={columns}
              dataSource={filteredTasks}
              rowKey="id"
              loading={loading}
              pagination={tableParams.pagination}
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedTask(record);
                  setDrawerVisible(true);
                },
              })}
              rowClassName={() => 'clickable-row'}
              scroll={{ x: 1500 }}
              size="small"
            />
          ) : (
            <Collapse
              activeKey={expandedProjects}
              onChange={(keys) => setExpandedProjects(keys as string[])}
              style={{ background: 'transparent', border: 'none' }}
            >
              {Object.entries(groupTasksByProject()).map(([projectName, projectTasks]) => {
                const stats = getProjectStats(projectTasks);
                return (
                  <Panel
                    key={projectName}
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Space>
                          <FolderOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{projectName}</span>
                          <Badge count={projectTasks.length} style={{ backgroundColor: '#722ed1' }} />
                        </Space>
                        <Space size="large" onClick={(e) => e.stopPropagation()}>
                          <span style={{ fontSize: 13, color: '#666' }}>
                            {stats.inProgress} 进行中
                          </span>
                          <span style={{ fontSize: 13, color: '#666' }}>
                            {stats.completed} 已完成
                          </span>
                          <span style={{ fontSize: 13, color: '#f5222d', fontWeight: 600 }}>
                            ${stats.totalBounty.toFixed(2)}
                          </span>
                        </Space>
                      </div>
                    }
                    style={{
                      marginBottom: 16,
                      background: '#fff',
                      borderRadius: 4,
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    <Table
                      columns={columns}
                      dataSource={projectTasks}
                      rowKey="id"
                      loading={loading}
                      pagination={false}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedTask(record);
                          setDrawerVisible(true);
                        },
                      })}
                      rowClassName={() => 'clickable-row'}
                      scroll={{ x: 1500 }}
                      size="small"
                    />
                  </Panel>
                );
              })}
            </Collapse>
          )}

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onAbandonTask={handleAbandonTask}
            onCompleteTask={handleCompleteTask}
            onTaskUpdated={onTaskUpdated}
            onTaskClick={handleTaskClick}
          />
        </>
      )}
    </>
  );
};
