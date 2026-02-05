import { createApiMethod, createApiMethodWithParams } from './createApiClient';

export interface BountyAlgorithm {
  id: string;
  version: string;
  baseAmount: number;
  urgencyWeight: number;
  importanceWeight: number;
  durationWeight: number;
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
  formula: string;
  effectiveFrom?: Date;
}

export const bountyApi = {
  // 获取所有赏金算法
  getAllAlgorithms: createApiMethod<BountyAlgorithm[]>('get', 'bounty/algorithms'),

  // 获取当前生效的算法
  getCurrentAlgorithm: createApiMethod<BountyAlgorithm>('get', 'bounty/algorithms/current'),

  // 获取指定版本的算法
  getAlgorithmByVersion: createApiMethodWithParams<BountyAlgorithm, string>('get', (version) => `bounty/algorithms/${version}`),

  // 创建新的赏金算法
  createAlgorithm: createApiMethod<BountyAlgorithm>('post', 'bounty/algorithms'),
};
