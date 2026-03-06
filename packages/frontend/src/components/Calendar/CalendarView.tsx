import React from 'react';
import { Modal, Card, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task, TaskStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { getTaskStatusConfig } from '../../utils/statusConfig';
import dayjs from 'dayjs';

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

interface CalendarViewProps {
  filteredTasks: Task[];
  groupByProject: boolean;
  expandedProjects: Set<string>;
  onTaskClick: (task: Task) => void;
  onProjectToggle: (projectName: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  filteredTasks,
  groupByProject,
  expandedProjects,
  onTaskClick,
  onProjectToggle,
}) => {
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
        start: new Date(task.plannedStartDate || new Date()),
        end: new Date(task.plannedEndDate || new Date()),
        backgroundColor: getStatusColor(task.status as TaskStatus),
        borderColor: getStatusColor(task.status as TaskStatus),
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
      const projectStart = new Date(Math.min(...projectTasks.map(t => new Date(t.plannedStartDate || new Date()).getTime())));
      const projectEnd = new Date(Math.max(...projectTasks.map(t => new Date(t.plannedEndDate || new Date()).getTime())));
      
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
            start: new Date(task.plannedStartDate || new Date()),
            end: new Date(task.plannedEndDate || new Date()),
            backgroundColor: getStatusColor(task.status as TaskStatus),
            borderColor: getStatusColor(task.status as TaskStatus),
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
      onProjectToggle(task.projectName);
      return;
    }
    
    // Otherwise, show task details
    onTaskClick(task);
  };

  const handleDateClick = (info: any) => {
    const clickedDate = dayjs(info.date);
    const tasksOnDate = filteredTasks.filter(task => {
      const start = dayjs(task.plannedStartDate || new Date());
      const end = dayjs(task.plannedEndDate || new Date());
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
                  borderLeft: `4px solid ${getStatusColor(task.status as TaskStatus)}`,
                }}
                hoverable
                onClick={() => {
                  Modal.destroyAll();
                  onTaskClick(task);
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  {task.name}
                </div>
                <Space size="middle">
                  <StatusBadge status={task.status as TaskStatus} />
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
  );
};