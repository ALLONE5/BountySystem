-- Add account_updated notification type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'account_updated'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'account_updated';
  END IF;
END$$;
