export interface AdminBudget {
  id: string;
  adminId: string;
  year: number;
  month: number;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminBudgetCreateDTO {
  adminId: string;
  year: number;
  month: number;
  totalBudget: number;
}
