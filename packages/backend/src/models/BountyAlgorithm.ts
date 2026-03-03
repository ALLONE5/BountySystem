export interface BountyAlgorithm {
  id: string;
  version: string;
  baseAmount: number;
  urgencyWeight: number;
  importanceWeight: number;
  durationWeight: number;
  remainingDaysWeight: number;
  formula: string;
  effectiveFrom: Date;
  createdBy: string;
  createdAt: Date;
}

export interface BountyAlgorithmCreateDTO {
  version: string;
  baseAmount: number;
  urgencyWeight: number;
  importanceWeight: number;
  durationWeight: number;
  remainingDaysWeight: number;
  formula: string;
  effectiveFrom?: Date;
  createdBy: string;
}

export interface BountyCalculationInput {
  estimatedHours: number | null;
  complexity: number | null;
  priority: number | null;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
}