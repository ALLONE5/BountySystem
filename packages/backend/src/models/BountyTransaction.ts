/**
 * BountyTransaction Model
 * 赏金交易记录
 */

export enum TransactionType {
  TASK_COMPLETION = 'task_completion',
  EXTRA_REWARD = 'extra_reward',
  ASSISTANT_SHARE = 'assistant_share',
  REFUND = 'refund',
}

export interface BountyTransaction {
  id: string;
  taskId: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  createdAt: Date;
}

export interface BountyTransactionCreateDTO {
  taskId: string;
  fromUserId?: string | null;
  toUserId: string;
  amount: number;
  type: TransactionType;
  description?: string;
}

export interface BountyTransactionWithDetails extends BountyTransaction {
  taskName: string;
  fromUsername: string | null;
  toUsername: string;
}

export interface UserBountyStats {
  totalEarned: number;
  totalSpent: number;
  balance: number;
  transactionCount: number;
  lastTransactionDate: Date | null;
}
