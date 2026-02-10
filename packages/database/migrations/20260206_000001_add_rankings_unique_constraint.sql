-- Add unique constraint to prevent duplicate rankings
-- This ensures that each user can only have one ranking per period/year/month/quarter combination

-- First, create a unique index that handles NULL values properly
CREATE UNIQUE INDEX rankings_user_period_unique_idx 
ON rankings (user_id, period, year, COALESCE(month, -1), COALESCE(quarter, -1));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rankings_period_year_month 
ON rankings(period, year, month) 
WHERE month IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rankings_period_year_quarter 
ON rankings(period, year, quarter) 
WHERE quarter IS NOT NULL;
