-- Sync call_recordings to activities table for analytics compatibility
-- This ensures analytics page shows correct call counts

-- Create function to sync call to activities
CREATE OR REPLACE FUNCTION sync_call_to_activities()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: Create corresponding activity record
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO activities (
      user_id,
      activity_type,
      activity_date,
      outcome,
      notes,
      customer_id,
      deal_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      'call',
      NEW.created_at,
      CASE
        WHEN NEW.status = 'completed' THEN 'successful'
        WHEN NEW.status IN ('failed', 'busy', 'no-answer') THEN 'unsuccessful'
        ELSE 'pending'
      END,
      CONCAT('Call to ', NEW.to_number, ' - Duration: ', COALESCE(NEW.duration_seconds, 0), 's'),
      NEW.customer_id,
      NEW.deal_id,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- On UPDATE: Update corresponding activity if exists
  IF (TG_OP = 'UPDATE') THEN
    UPDATE activities
    SET
      outcome = CASE
        WHEN NEW.status = 'completed' THEN 'successful'
        WHEN NEW.status IN ('failed', 'busy', 'no-answer') THEN 'unsuccessful'
        ELSE 'pending'
      END,
      notes = CONCAT('Call to ', NEW.to_number, ' - Duration: ', COALESCE(NEW.duration_seconds, 0), 's'),
      customer_id = NEW.customer_id,
      deal_id = NEW.deal_id,
      updated_at = NEW.updated_at
    WHERE user_id = NEW.user_id
      AND activity_type = 'call'
      AND activity_date = NEW.created_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync calls
DROP TRIGGER IF EXISTS trigger_sync_call_to_activities ON call_recordings;
CREATE TRIGGER trigger_sync_call_to_activities
  AFTER INSERT OR UPDATE ON call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION sync_call_to_activities();

-- Backfill existing call_recordings into activities
-- This ensures historical data is synced
INSERT INTO activities (
  user_id,
  activity_type,
  activity_date,
  outcome,
  notes,
  customer_id,
  deal_id,
  created_at,
  updated_at
)
SELECT
  cr.user_id,
  'call' as activity_type,
  cr.created_at as activity_date,
  CASE
    WHEN cr.status = 'completed' THEN 'successful'
    WHEN cr.status IN ('failed', 'busy', 'no-answer') THEN 'unsuccessful'
    ELSE 'pending'
  END as outcome,
  CONCAT('Call to ', cr.to_number, ' - Duration: ', COALESCE(cr.duration_seconds, 0), 's') as notes,
  cr.customer_id,
  cr.deal_id,
  cr.created_at,
  cr.updated_at
FROM call_recordings cr
WHERE NOT EXISTS (
  SELECT 1 FROM activities a
  WHERE a.user_id = cr.user_id
    AND a.activity_type = 'call'
    AND a.activity_date = cr.created_at
);
