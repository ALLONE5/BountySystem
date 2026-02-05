export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
}

export interface TaskDependencyCreateDTO {
  taskId: string;
  dependsOnTaskId: string;
}
