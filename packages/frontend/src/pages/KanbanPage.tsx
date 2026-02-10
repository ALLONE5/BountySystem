import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Select, Button, Tag, Badge, Space, Switch, Collapse, Input, Modal } from 'antd';
import { ReloadOutlined, DollarOutlined, ClockCircleOutlined, FlagOutlined, FolderOutlined, SearchOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { taskApi } from '../api/task';
import { Task, TaskStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import dayjs from 'dayjs';

const { Option } = Select;
const { Panel } = Collapse;

const STATUS_COLUMNS = [
  { key: TaskStatus.NOT_STARTED, title: '未开始', color: '#d9d9d9' },
  { key: TaskStatus.AVAILABLE, title: '可承接', color: '#52c41a' },
  { key: TaskStatus.PENDING_ACCEPTANCE, title: '待接受', color: '#faad14' },
  { key: TaskStatus.IN_PROGRESS, title: '进行中', color: '#1890ff' },
  { key: TaskStatus.COMPLETED, title: '已完成', color: '#52c41a' },
];

interface KanbanPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
}

export const KanbanPage: React.FC<KanbanPageProps> = ({ tasks: propTasks, loading: propLoading, hideFilters }) => {
  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  const loading = propLoading !== undefined ? propLoading : internalLoading;

  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (propTasks) {
      setDisplayTasks(propTasks);
    } else {
      setDisplayTasks(internalTasks);
    }
  }, [propTasks, internalTasks]);

  useEffect(() => {
    if (!propTasks) {
      loadTasks();
    }
  }, [propTasks]);

  useEffect(() => {
    applyFilters();
  }, [displayTasks, searchText, statusFilter]);

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
    let filtered = [...displayTasks];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
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
          setDrawerVisible(false);
          if (!propTasks) {
            loadTasks();
          }
        } catch (error) {
          message.error('完成任务失败');
          console.error('Failed to complete task:', error);
          throw error;
        }
      },
    });
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const task = displayTasks.find(t => t.id === draggableId);

    if (!task) {
      return;
    }

    try {
      // Optimistically update UI
      const updatedTasks = displayTasks.map(t =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      );
      
      if (propTasks) {
         setDisplayTasks(updatedTasks);
      } else {
         setInternalTasks(updatedTasks);
      }

      await taskApi.updateTask(draggableId, { status: newStatus });
      message.success('任务状态已更新');
    } catch (error) {
      message.error('更新任务状态失败');
      console.error(error);
      // Revert on error
      if (!propTasks) loadTasks();
    }
  };

  const getTasksByStatus = (status: TaskStatus, tasks?: Task[]): Task[] => {
    const tasksToFilter = tasks || displayTasks;
    return tasksToFilter.filter(task => task.status === status);
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

  const renderKanbanBoard = (tasks: Task[], droppablePrefix: string = '') => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: 16 }}>
        {STATUS_COLUMNS.map(column => {
          const columnTasks = getTasksByStatus(column.key, tasks);
          return (
            <div
              key={column.key}
              style={{
                flex: '1',
                minWidth: '300px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${column.color}`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '15px' }}>
                  {column.title}
                </span>
                <Badge
                  count={columnTasks.length}
                  style={{ backgroundColor: column.color }}
                  showZero
                />
              </div>

              <Droppable droppableId={`${droppablePrefix}${column.key}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: '500px',
                      backgroundColor: snapshot.isDraggingOver
                        ? '#e6f7ff'
                        : 'transparent',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s',
                      padding: '4px',
                    }}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              marginBottom: '12px',
                            }}
                          >
                            <Card
                              size="small"
                              className="task-card"
                              hoverable
                              style={{
                                backgroundColor: snapshot.isDragging
                                  ? '#e6f7ff'
                                  : 'white',
                                cursor: 'move',
                                borderLeft: `3px solid ${column.color}`,
                                boxShadow: snapshot.isDragging
                                  ? '0 4px 12px rgba(0,0,0,0.15)'
                                  : undefined,
                              }}
                              onClick={() => {
                                setSelectedTask(task);
                                setDrawerVisible(true);
                              }}
                            >
                              <div style={{ marginBottom: '12px' }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                  }}
                                >
                                  {task.name}
                                </div>
                                {task.description && (
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#666',
                                      marginBottom: '12px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: '1.5',
                                    }}
                                  >
                                    {task.description}
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  gap: '6px',
                                  flexWrap: 'wrap',
                                  marginBottom: '12px',
                                }}
                              >
                                <Tag
                                  icon={<DollarOutlined />}
                                  color="red"
                                  style={{ fontSize: '12px', fontWeight: 600 }}
                                >
                                  ${task.bountyAmount}
                                </Tag>
                                <Tag
                                  icon={<FlagOutlined />}
                                  color={getPriorityColor(task.priority)}
                                  style={{ fontSize: '12px' }}
                                >
                                  P{task.priority}
                                </Tag>
                                <Tag color="blue" style={{ fontSize: '12px' }}>
                                  {getComplexityText(task.complexity)}
                                </Tag>
                              </div>

                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#999',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: task.progress > 0 ? '12px' : 0,
                                }}
                              >
                                <ClockCircleOutlined />
                                <span>
                                  {dayjs(task.plannedEndDate).format('YYYY-MM-DD')}
                                </span>
                              </div>

                              {task.progress > 0 && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#666',
                                      marginBottom: '6px',
                                      fontWeight: 500,
                                    }}
                                  >
                                    进度: {task.progress}%
                                  </div>
                                  <div
                                    style={{
                                      height: '8px',
                                      backgroundColor: '#f0f0f0',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${task.progress}%`,
                                        backgroundColor: column.color,
                                        transition: 'width 0.3s',
                                        borderRadius: '4px',
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {task.tags && task.tags.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                  {task.tags.slice(0, 3).map(tag => (
                                    <Tag
                                      key={tag}
                                      style={{ fontSize: '11px', marginBottom: '4px' }}
                                    >
                                      {tag}
                                    </Tag>
                                  ))}
                                </div>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );

  const getPriorityColor = (priority: number): string => {
    if (priority >= 4) return 'red';
    if (priority >= 3) return 'orange';
    return 'blue';
  };

  const getComplexityText = (complexity: number): string => {
    const levels = ['极简', '简单', '中等', '复杂', '极难'];
    return levels[complexity - 1] || '未知';
  };

  return (
    <>
      {!hideFilters && (
        <div style={{ padding: '24px' }}>
          <Card 
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>📋 看板视图</span>}
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
                  <Option value={TaskStatus.PENDING_ACCEPTANCE}>待接受</Option>
                  <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
                  <Option value={TaskStatus.COMPLETED}>已完成</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={loadTasks}>
                  刷新
                </Button>
              </Space>
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : !groupByProject ? (
              renderKanbanBoard(filteredTasks)
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
                      {renderKanbanBoard(projectTasks, `${projectName}-`)}
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
            onTaskClick={handleTaskClick}
          />
        </div>
      )}

      {hideFilters && (
        <>
          <div style={{ 
            marginTop: 16,
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
                <Option value={TaskStatus.PENDING_ACCEPTANCE}>待接受</Option>
                <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
                <Option value={TaskStatus.COMPLETED}>已完成</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={loadTasks}>
                刷新
              </Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : !groupByProject ? (
            renderKanbanBoard(filteredTasks)
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
                    {renderKanbanBoard(projectTasks, `${projectName}-`)}
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
            onTaskClick={handleTaskClick}
          />
        </>
      )}
    </>
  );
};
