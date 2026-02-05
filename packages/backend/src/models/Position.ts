import { UserResponse } from './User.js';

export interface Position {
  id: string;
  name: string;
  description: string | null;
  requiredSkills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PositionCreateDTO {
  name: string;
  description?: string;
  requiredSkills?: string[];
}

export interface PositionUpdateDTO {
  name?: string;
  description?: string;
  requiredSkills?: string[];
}

export interface UserPosition {
  id: string;
  userId: string;
  positionId: string;
  grantedAt: Date;
}

export interface PositionAdmin {
  id: string;
  positionId: string;
  adminId: string;
  assignedAt: Date;
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface PositionApplication {
  id: string;
  userId: string;
  positionId: string;
  reason: string | null;
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewComment: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  updatedAt: Date;
  user?: UserResponse;
  position?: {
    id: string;
    name: string;
    description: string | null;
    requiredSkills?: string[];
  };
}

export interface PositionApplicationCreateDTO {
  userId: string;
  positionId: string;
  reason?: string;
}

export interface PositionApplicationReviewDTO {
  applicationId: string;
  reviewerId: string;
  approved: boolean;
  reviewComment?: string;
}
