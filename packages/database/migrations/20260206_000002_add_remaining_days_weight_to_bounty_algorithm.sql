-- Migration: Add remaining_days_weight to bounty_algorithms table
-- Date: 2026-02-06
-- Description: Add remaining_days_weight field to support time-based bounty calculation

-- Add remaining_days_weight column
ALTER TABLE bounty_algorithms
ADD COLUMN remaining_days_weight DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Update existing algorithms with a default weight
UPDATE bounty_algorithms
SET remaining_days_weight = 5.0
WHERE remaining_days_weight = 0;

-- Add comment to explain the field
COMMENT ON COLUMN bounty_algorithms.remaining_days_weight IS 'Weight multiplier for remaining days until deadline in bounty calculation';
