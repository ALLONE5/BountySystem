import { Task } from './Task.js';

/**
 * ProjectGroup Model
 * 项目组群 - 用于将多个相关任务归类到同一个项目下
 */

export interface ProjectGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectGroupCreateDTO {
  name: string;
  description?: string;
}

export interface ProjectGroupUpdateDTO {
  name?: string;
  description?: string;
}

export interface ProjectGroupWithTasks extends ProjectGroup {
  taskCount: number;
  completedTaskCount: number;
  totalBounty: number;
  tasks?: Task[];
}

export interface ProjectGroupStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  availableTasks: number;
  totalBounty: number;
  earnedBounty: number;
  completionRate: number;
}
