-- Rollback Migration: Remove remaining_days_weight from bounty_algorithms table
-- Date: 2026-02-06

-- Remove the remaining_days_weight column
ALTER TABLE bounty_algorithms
DROP COLUMN IF EXISTS remaining_days_weight;
