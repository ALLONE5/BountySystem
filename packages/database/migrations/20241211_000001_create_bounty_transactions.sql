-- Migration: Create Bounty Transactions Table
-- Description: Creates bounty_transactions table for tracking bounty distribution history
-- Date: 2024-12-11

BEGIN;

-- ============================================================================
-- Transaction Type Enum
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('main_bounty', 'assistant_bounty', 'extra_bounty');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Bounty Transactions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bounty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  transaction_type transaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for bounty_transactions table
CREATE INDEX idx_bounty_transactions_task_id ON bounty_transactions(task_id);
CREATE INDEX idx_bounty_transactions_user_id ON bounty_transactions(user_id);
CREATE INDEX idx_bounty_transactions_created_at ON bounty_transactions(created_at);

COMMIT;
