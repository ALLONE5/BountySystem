import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Select, Button, Modal, Space, Switch, Input } from 'antd';
import { ReloadOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { taskApi } from '../api/task';
import { Task, TaskStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { getTaskStatusConfig } from '../utils/statusConfig';
import dayjs from 'dayjs';

const { Option } = Select;

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    task: Task;
  };
}

interface CalendarPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ tasks: propTasks, loading: propLoading, hideFilters }) => {
  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const tasks = propTasks || internalTasks;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  useEffect(() => {
    if (!propTasks) {
      loadTasks();
    }
  }, [propTasks]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchText, statusFilter]);

  // Initialize expanded projects when groupByProject is enabled
  useEffect(() => {
    if (groupByProject && filteredTasks.length > 0) {
      const projectNames = new Set(filteredTasks.map(t => t.projectGroupName || '无项目组'));
      setExpandedProjects(projectNames);
    }
  }, [groupByProject, filteredTasks]);

  const toggleProject = (projectName: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

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

  const getStatusColor = (status: TaskStatus): string => {
    const colorMap: Record<string, string> = {
      'default': '#d9d9d9',
      'success': '#52c41a',
      'processing': '#1890ff',
      'error': '#ff4d4f',
      'orange': '#fa8c16',
    };
    const config = getTaskStatusConfig(status);
    return colorMap[config.color] || config.color;
  };

  const convertTasksToEvents = (): CalendarEvent[] => {
    if (!groupByProject) {
      // Normal mode: show all tasks
      return filteredTasks.map(task => ({
        id: task.id,
        title: task.name,
        start: new Date(task.plannedStartDate),
        end: new Date(task.plannedEndDate),
        backgroundColor: getStatusColor(task.status),
        borderColor: getStatusColor(task.status),
        extendedProps: {
          task,
        },
      }));
    }

    // Group mode: show project summaries and expanded tasks
    const grouped: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      const key = task.projectGroupName || '无项目组';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    const events: CalendarEvent[] = [];

    Object.entries(grouped).forEach(([projectName, projectTasks]) => {
      // Calculate project summary dates
      const projectStart = new Date(Math.min(...projectTasks.map(t => new Date(t.plannedStartDate).getTime())));
      const projectEnd = new Date(Math.max(...projectTasks.map(t => new Date(t.plannedEndDate).getTime())));
      
      // Add project summary event
      events.push({
        id: `project-${projectName}`,
        title: `📁 ${projectName} (${projectTasks.length})`,
        start: projectStart,
        end: projectEnd,
        backgroundColor: '#722ed1',
        borderColor: '#722ed1',
        extendedProps: {
          task: {
            ...projectTasks[0],
            id: `project-${projectName}`,
            name: projectName,
            isProjectSummary: true,
            projectName,
            taskCount: projectTasks.length,
          } as any,
        },
      });

      // If expanded, add child tasks
      if (expandedProjects.has(projectName)) {
        projectTasks.forEach(task => {
          events.push({
            id: task.id,
            title: `  ${task.name}`, // Indentation
            start: new Date(task.plannedStartDate),
            end: new Date(task.plannedEndDate),
            backgroundColor: getStatusColor(task.status),
            borderColor: getStatusColor(task.status),
            extendedProps: {
              task,
            },
          });
        });
      }
    });

    return events;
  };

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    
    // If it's a project summary, toggle expand/collapse
    if (task.isProjectSummary) {
      toggleProject(task.projectName);
      return;
    }
    
    // Otherwise, show task details
    setSelectedTask(task);
    setDrawerVisible(true);
  };

  const handleDateClick = (info: any) => {
    const clickedDate = dayjs(info.date);
    const tasksOnDate = filteredTasks.filter(task => {
      const start = dayjs(task.plannedStartDate);
      const end = dayjs(task.plannedEndDate);
      return clickedDate.isSame(start, 'day') || 
             clickedDate.isSame(end, 'day') ||
             (clickedDate.isAfter(start, 'day') && clickedDate.isBefore(end, 'day'));
    });

    if (tasksOnDate.length > 0) {
      Modal.info({
        title: (
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {clickedDate.format('YYYY年MM月DD日')} 的任务
          </div>
        ),
        width: 600,
        content: (
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: 16 }}>
            {tasksOnDate.map(task => (
              <Card
                key={task.id}
                size="small"
                className="task-card"
                style={{ 
                  marginBottom: 12, 
                  cursor: 'pointer',
                  borderLeft: `4px solid ${getStatusColor(task.status)}`,
                }}
                hoverable
                onClick={() => {
                  Modal.destroyAll();
                  setSelectedTask(task);
                  setDrawerVisible(true);
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  {task.name}
                </div>
                <Space size="middle">
                  <StatusBadge status={task.status} />
                  <span style={{ color: '#f5222d', fontSize: 14, fontWeight: 600 }}>
                    ${task.bountyAmount}
                  </span>
                </Space>
              </Card>
            ))}
          </div>
        ),
        okText: '关闭',
      });
    }
  };

  return (
    <>
      {!hideFilters && (
        <div style={{ padding: '24px' }}>
          <Card 
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>📅 日历视图</span>}
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
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={convertTasksToEvents()}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek',
                }}
                height="auto"
                locale="zh-cn"
                buttonText={{
                  today: '今天',
                  month: '月',
                  week: '周',
                }}
              />
            )}
          </Card>

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onAbandonTask={handleAbandonTask}
            onCompleteTask={handleCompleteTask}
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
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={convertTasksToEvents()}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              height="auto"
              locale="zh-cn"
              buttonText={{
                today: '今天',
                month: '月',
                week: '周',
              }}
            />
          )}

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onAbandonTask={handleAbandonTask}
            onCompleteTask={handleCompleteTask}
          />
        </>
      )}
    </>
  );
};
