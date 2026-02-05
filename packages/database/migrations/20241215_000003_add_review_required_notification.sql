-- Add review_required notification type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'review_required'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'review_required';
  END IF;
END$$;
