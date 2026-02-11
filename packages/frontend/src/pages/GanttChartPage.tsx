import React, { useEffect, useRef, useState } from 'react';
import { Card, Spin, message, Select, Button, Switch, Space, Input, Modal } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import * as d3 from 'd3';
import { taskApi } from '../api/task';
import { Task, TaskStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { getTaskStatusConfig } from '../utils/statusConfig';

const { Option } = Select;

interface GanttChartPageProps {
  tasks?: Task[];
  loading?: boolean;
  hideFilters?: boolean;
}

export const GanttChartPage: React.FC<GanttChartPageProps> = ({ tasks: propTasks, loading: propLoading, hideFilters = false }) => {
  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [groupByProject, setGroupByProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (filteredTasks.length > 0 && svgRef.current && containerRef.current) {
      renderGanttChart();
    }
  }, [filteredTasks, groupByProject, expandedProjects]);

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

  const toggleProject = (projectName: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectName)) {
      newExpanded.delete(projectName);
    } else {
      newExpanded.add(projectName);
    }
    setExpandedProjects(newExpanded);
  };

  const getDisplayItems = (): Array<{ type: 'project' | 'task'; data: any; projectName?: string }> => {
    if (!groupByProject) {
      return filteredTasks.map(task => ({ type: 'task' as const, data: task }));
    }

    // Group tasks by project
    const grouped: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      const key = task.projectGroupName || '无项目组';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    // Build display items - projects are treated as summary tasks
    const items: Array<{ type: 'project' | 'task'; data: any; projectName?: string }> = [];
    
    Object.entries(grouped).forEach(([projectName, projectTasks]) => {
      // Calculate project summary dates (earliest start, latest end)
      const projectStart = new Date(Math.min(...projectTasks.map(t => new Date(t.plannedStartDate).getTime())));
      const projectEnd = new Date(Math.max(...projectTasks.map(t => new Date(t.plannedEndDate).getTime())));
      const avgProgress = Math.round(projectTasks.reduce((sum, t) => sum + t.progress, 0) / projectTasks.length);
      
      // Add project as a summary task
      items.push({ 
        type: 'project', 
        data: { 
          name: projectName, 
          taskCount: projectTasks.length,
          plannedStartDate: projectStart,
          plannedEndDate: projectEnd,
          progress: avgProgress
        } 
      });
      
      // If expanded, add child tasks with indentation
      if (expandedProjects.has(projectName)) {
        projectTasks.forEach(task => {
          items.push({ type: 'task', data: task, projectName });
        });
      }
    });

    return items;
  };

  const renderGanttChart = () => {
    if (!svgRef.current || !containerRef.current) return;

    const displayItems = getDisplayItems();
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    if (displayItems.length === 0) {
      // Render empty state
      const svg = d3.select(svgRef.current)
        .attr('width', containerRef.current.clientWidth)
        .attr('height', 100);
      
      svg.append('text')
        .attr('x', containerRef.current.clientWidth / 2)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#999')
        .text('暂无任务数据');
      
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const margin = { top: 50, right: 30, bottom: 50, left: 200 };
    const barHeight = 40;
    const barPadding = 10;
    
    // Calculate height based on display items (all items use same height now)
    const totalHeight = margin.top + margin.bottom + (displayItems.length * (barHeight + barPadding));

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', totalHeight);

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate time scale from filtered tasks
    const allTasks = filteredTasks;
    const minDate = d3.min(allTasks, d => new Date(d.plannedStartDate)) || new Date();
    const maxDate = d3.max(allTasks, d => new Date(d.plannedEndDate)) || new Date();
    
    const xScale = d3.scaleTime()
      .domain([minDate, maxDate])
      .range([0, width - margin.left - margin.right]);

    // Add X axis
    const xAxis = d3.axisTop(xScale)
      .ticks(d3.timeWeek.every(1))
      .tickFormat(d3.timeFormat('%m/%d') as any);

    chartGroup.append('g')
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'middle');

    // Render items
    let currentY = 0;
    displayItems.forEach((item) => {
      if (item.type === 'project') {
        // Render project as a summary task bar
        const projectData = item.data;
        const projectGroup = chartGroup.append('g')
          .attr('transform', `translate(0,${currentY})`)
          .style('cursor', 'pointer')
          .on('click', () => toggleProject(projectData.name));

        const isExpanded = expandedProjects.has(projectData.name);

        // Project name label with expand/collapse icon
        projectGroup.append('text')
          .attr('x', -10)
          .attr('y', barHeight / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .style('font-size', '13px')
          .style('font-weight', 'bold')
          .style('fill', '#722ed1')
          .text(() => {
            const icon = isExpanded ? '▼' : '▶';
            const name = projectData.name;
            const displayName = name.length > 15 ? name.substring(0, 15) + '...' : name;
            return `${icon} 📁 ${displayName} (${projectData.taskCount})`;
          });

        // Project summary bar background
        projectGroup.append('rect')
          .attr('x', xScale(new Date(projectData.plannedStartDate)))
          .attr('width', () => {
            const start = xScale(new Date(projectData.plannedStartDate));
            const end = xScale(new Date(projectData.plannedEndDate));
            return Math.max(end - start, 2);
          })
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', '#722ed1')
          .attr('opacity', 0.2)
          .style('cursor', 'pointer');

        // Project progress bar
        projectGroup.append('rect')
          .attr('x', xScale(new Date(projectData.plannedStartDate)))
          .attr('width', () => {
            const start = xScale(new Date(projectData.plannedStartDate));
            const end = xScale(new Date(projectData.plannedEndDate));
            const totalWidth = Math.max(end - start, 2);
            const progress = Math.min(Math.max(projectData.progress || 0, 0), 100); // Ensure progress is between 0-100
            return totalWidth * (progress / 100);
          })
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', '#722ed1')
          .attr('opacity', 0.6)
          .style('cursor', 'pointer');

        // Progress text
        projectGroup.append('text')
          .attr('x', () => {
            const start = xScale(new Date(projectData.plannedStartDate));
            const end = xScale(new Date(projectData.plannedEndDate));
            return start + (end - start) / 2;
          })
          .attr('y', barHeight / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('fill', 'white')
          .style('font-weight', 'bold')
          .style('pointer-events', 'none') // Prevent text from blocking clicks
          .text(`${Math.round(projectData.progress || 0)}%`);

        currentY += barHeight + barPadding;
      } else {
        // Render task bar (child task with indentation)
        const task = item.data;
        const taskGroup = chartGroup.append('g')
          .attr('transform', `translate(0,${currentY})`);

        // Task name label with indentation
        taskGroup.append('text')
          .attr('x', -10)
          .attr('y', barHeight / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .style('font-size', '12px')
          .style('cursor', 'pointer')
          .style('fill', '#1890ff')
          .text(() => {
            const prefix = '    '; // Indentation for child tasks
            const name = task.name;
            return prefix + (name.length > 15 ? name.substring(0, 15) + '...' : name);
          })
          .on('click', () => {
            setSelectedTask(task);
            setDrawerVisible(true);
          });

        // Task bar background
        taskGroup.append('rect')
          .attr('x', xScale(new Date(task.plannedStartDate)))
          .attr('width', () => {
            const start = xScale(new Date(task.plannedStartDate));
            const end = xScale(new Date(task.plannedEndDate));
            return Math.max(end - start, 2);
          })
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', getStatusColor(task.status))
          .attr('opacity', 0.3)
          .style('cursor', 'pointer')
          .on('click', () => {
            setSelectedTask(task);
            setDrawerVisible(true);
          });

        // Progress bar
        taskGroup.append('rect')
          .attr('x', xScale(new Date(task.plannedStartDate)))
          .attr('width', () => {
            const start = xScale(new Date(task.plannedStartDate));
            const end = xScale(new Date(task.plannedEndDate));
            const totalWidth = Math.max(end - start, 2);
            const progress = Math.min(Math.max(task.progress || 0, 0), 100); // Ensure progress is between 0-100
            return totalWidth * (progress / 100);
          })
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', getStatusColor(task.status))
          .style('cursor', 'pointer')
          .on('click', () => {
            setSelectedTask(task);
            setDrawerVisible(true);
          });

        // Progress text
        taskGroup.append('text')
          .attr('x', () => {
            const start = xScale(new Date(task.plannedStartDate));
            const end = xScale(new Date(task.plannedEndDate));
            return start + (end - start) / 2;
          })
          .attr('y', barHeight / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('fill', 'white')
          .style('font-weight', 'bold')
          .style('pointer-events', 'none') // Prevent text from blocking clicks
          .text(`${Math.round(task.progress || 0)}%`);

        currentY += barHeight + barPadding;
      }
    });

    // Add arrow marker for dependencies
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#1890ff');
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

  return (
    <>
      {!hideFilters && (
        <div style={{ padding: '24px' }}>
          <Card 
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>📊 甘特图视图</span>}
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
            ) : filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                暂无任务数据
              </div>
            ) : (
              <div ref={containerRef} style={{ overflowX: 'auto' }}>
                <svg ref={svgRef}></svg>
              </div>
            )}
          </Card>

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
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
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              暂无任务数据
            </div>
          ) : (
            <div ref={containerRef} style={{ overflowX: 'auto' }}>
              <svg ref={svgRef}></svg>
            </div>
          )}

          <TaskDetailDrawer
            task={selectedTask}
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onCompleteTask={handleCompleteTask}
          />
        </>
      )}
    </>
  );
};
