import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Task, TaskStatus } from '../../types';
import { getTaskStatusConfig } from '../../utils/statusConfig';

interface GanttChartProps {
  filteredTasks: Task[];
  groupByProject: boolean;
  expandedProjects: Set<string>;
  onTaskClick: (task: Task) => void;
  onProjectToggle: (projectName: string) => void;
}

interface DisplayItem {
  type: 'project' | 'task';
  data: any;
  projectName?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  filteredTasks,
  groupByProject,
  expandedProjects,
  onTaskClick,
  onProjectToggle,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (filteredTasks.length > 0 && svgRef.current && containerRef.current) {
      renderGanttChart();
    }
  }, [filteredTasks, groupByProject, expandedProjects]);

  const getDisplayItems = (): DisplayItem[] => {
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
    const items: DisplayItem[] = [];
    
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
    
    // Calculate height based on display items
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
          .on('click', () => onProjectToggle(projectData.name));

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
            const progress = Math.min(Math.max(projectData.progress || 0, 0), 100);
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
          .style('pointer-events', 'none')
          .text(`${Math.round(projectData.progress || 0)}%`);

        currentY += barHeight + barPadding;
      } else {
        // Render task bar
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
          .on('click', () => onTaskClick(task));

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
          .on('click', () => onTaskClick(task));

        // Progress bar
        taskGroup.append('rect')
          .attr('x', xScale(new Date(task.plannedStartDate)))
          .attr('width', () => {
            const start = xScale(new Date(task.plannedStartDate));
            const end = xScale(new Date(task.plannedEndDate));
            const totalWidth = Math.max(end - start, 2);
            const progress = Math.min(Math.max(task.progress || 0, 0), 100);
            return totalWidth * (progress / 100);
          })
          .attr('height', barHeight)
          .attr('rx', 4)
          .attr('fill', getStatusColor(task.status))
          .style('cursor', 'pointer')
          .on('click', () => onTaskClick(task));

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
          .style('pointer-events', 'none')
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

  return (
    <div ref={containerRef} style={{ overflowX: 'auto' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};