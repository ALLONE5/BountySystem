-- Rollback: Remove unique constraint and indexes

DROP INDEX IF EXISTS idx_rankings_period_year_quarter;
DROP INDEX IF EXISTS idx_rankings_period_year_month;
DROP INDEX IF EXISTS rankings_user_period_unique_idx;
