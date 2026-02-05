-- Add balance field to users table
-- Migration: 20260203_000002_add_user_balance

-- Add balance column to users table
ALTER TABLE users 
ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;

-- Add check constraint to ensure balance is not negative
ALTER TABLE users 
ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0);

-- Add index for balance queries
CREATE INDEX idx_users_balance ON users(balance);

-- Add comment
COMMENT ON COLUMN users.balance IS 'User account balance for bounty payments';
