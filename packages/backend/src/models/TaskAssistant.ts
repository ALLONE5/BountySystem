export enum AllocationType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface TaskAssistant {
  id: string;
  taskId: string;
  userId: string;
  allocationType: AllocationType;
  allocationValue: number;
  addedAt: Date;
  user?: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface TaskAssistantCreateDTO {
  taskId: string;
  userId: string;
  allocationType: AllocationType;
  allocationValue: number;
}

export interface BountyAllocation {
  allocationType: AllocationType;
  allocationValue: number;
}
