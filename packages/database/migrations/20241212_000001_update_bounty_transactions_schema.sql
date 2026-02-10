-- Migration: Update Bounty Transactions Schema
-- Description: Updates bounty_transactions table to support transaction history tracking
--              with from_user_id, to_user_id, type, description, and status fields
-- Date: 2024-12-12

BEGIN;

-- ============================================================================
-- Drop existing table and recreate with new schema
-- ============================================================================

-- Drop existing bounty_transactions table if it exists
DROP TABLE IF EXISTS bounty_transactions CASCADE;

-- Drop old transaction_type enum if it exists
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Create new transaction_type enum with updated values
CREATE TYPE transaction_type AS ENUM (
  'task_completion',
  'extra_reward',
  'assistant_share',
  'refund'
);

-- Create transaction_status enum
CREATE TYPE transaction_status AS ENUM (
  'pending',
  'locked',
  'completed',
  'cancelled'
);

-- Create bounty_transactions table with new schema
CREATE TABLE bounty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  type transaction_type NOT NULL,
  description TEXT,
  status transaction_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for bounty_transactions table
CREATE INDEX idx_bounty_transactions_task_id ON bounty_transactions(task_id);
CREATE INDEX idx_bounty_transactions_from_user_id ON bounty_transactions(from_user_id);
CREATE INDEX idx_bounty_transactions_to_user_id ON bounty_transactions(to_user_id);
CREATE INDEX idx_bounty_transactions_created_at ON bounty_transactions(created_at DESC);
CREATE INDEX idx_bounty_transactions_type ON bounty_transactions(type);
CREATE INDEX idx_bounty_transactions_status ON bounty_transactions(status);

-- Composite index for user transaction history queries
CREATE INDEX idx_bounty_transactions_user_history ON bounty_transactions(from_user_id, to_user_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE bounty_transactions IS 'Tracks all bounty transactions between users';
COMMENT ON COLUMN bounty_transactions.task_id IS 'Task associated with the transaction (nullable for non-task transactions)';
COMMENT ON COLUMN bounty_transactions.from_user_id IS 'User sending the bounty (nullable for system-generated bounties)';
COMMENT ON COLUMN bounty_transactions.to_user_id IS 'User receiving the bounty';
COMMENT ON COLUMN bounty_transactions.amount IS 'Bounty amount in platform currency';
COMMENT ON COLUMN bounty_transactions.type IS 'Type of transaction: task_completion, extra_reward, assistant_share, refund';
COMMENT ON COLUMN bounty_transactions.description IS 'Optional description of the transaction';
COMMENT ON COLUMN bounty_transactions.status IS 'Transaction status: pending, locked, completed, cancelled';
COMMENT ON COLUMN bounty_transactions.created_at IS 'Timestamp when transaction was created';
COMMENT ON COLUMN bounty_transactions.updated_at IS 'Timestamp when transaction was last updated';

COMMIT;
