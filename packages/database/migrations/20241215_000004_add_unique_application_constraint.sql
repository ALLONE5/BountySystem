-- Migration: Add Unique Constraint for Pending Applications
-- Description: Prevents duplicate pending applications for the same position by the same user
-- Date: 2024-12-15

BEGIN;

-- 1. Clean up any existing duplicates (keep the oldest one)
DELETE FROM position_applications pa
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, position_id ORDER BY created_at ASC) as rnum
    FROM position_applications
    WHERE status = 'pending'
  ) t
  WHERE t.rnum > 1
);

-- 2. Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_application 
ON position_applications(user_id, position_id) 
WHERE status = 'pending';

COMMIT;
