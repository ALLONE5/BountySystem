-- Rollback: Drop Bounty Transactions Table
-- Description: Removes bounty_transactions table
-- Date: 2024-12-11

BEGIN;

DROP TABLE IF EXISTS bounty_transactions CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

COMMIT;
