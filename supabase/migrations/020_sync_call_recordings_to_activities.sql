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
      subject,
      description,
      duration_minutes,
      outcome,
      customer_id,
      deal_id,
      completed_at,
      created_at
    ) VALUES (
      NEW.user_id,
      'call',
      CONCAT('Call to ', NEW.to_number),
      CONCAT('Call duration: ', COALESCE(NEW.duration_seconds, 0), 's'),
      COALESCE(NEW.duration_seconds / 60, 0),
      CASE
        WHEN NEW.status = 'completed' THEN 'successful'
        WHEN NEW.status = 'no-answer' THEN 'no_answer'
        WHEN NEW.status IN ('failed', 'busy') THEN 'not_interested'
        ELSE 'successful'
      END,
      NEW.customer_id,
      NEW.deal_id,
      CASE WHEN NEW.status = 'completed' THEN NEW.created_at ELSE NULL END,
      NEW.created_at
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- On UPDATE: Update corresponding activity if exists
  IF (TG_OP = 'UPDATE') THEN
    UPDATE activities
    SET
      subject = CONCAT('Call to ', NEW.to_number),
      description = CONCAT('Call duration: ', COALESCE(NEW.duration_seconds, 0), 's'),
      duration_minutes = COALESCE(NEW.duration_seconds / 60, 0),
      outcome = CASE
        WHEN NEW.status = 'completed' THEN 'successful'
        WHEN NEW.status = 'no-answer' THEN 'no_answer'
        WHEN NEW.status IN ('failed', 'busy') THEN 'not_interested'
        ELSE 'successful'
      END,
      customer_id = NEW.customer_id,
      deal_id = NEW.deal_id,
      completed_at = CASE WHEN NEW.status = 'completed' THEN NEW.created_at ELSE NULL END
    WHERE user_id = NEW.user_id
      AND activity_type = 'call'
      AND created_at = NEW.created_at;
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
  subject,
  description,
  duration_minutes,
  outcome,
  customer_id,
  deal_id,
  completed_at,
  created_at
)
SELECT
  cr.user_id,
  'call' as activity_type,
  CONCAT('Call to ', cr.to_number) as subject,
  CONCAT('Call duration: ', COALESCE(cr.duration_seconds, 0), 's') as description,
  COALESCE(cr.duration_seconds / 60, 0) as duration_minutes,
  CASE
    WHEN cr.status = 'completed' THEN 'successful'
    WHEN cr.status = 'no-answer' THEN 'no_answer'
    WHEN cr.status IN ('failed', 'busy') THEN 'not_interested'
    ELSE 'successful'
  END as outcome,
  cr.customer_id,
  cr.deal_id,
  CASE WHEN cr.status = 'completed' THEN cr.created_at ELSE NULL END as completed_at,
  cr.created_at
FROM call_recordings cr
WHERE NOT EXISTS (
  SELECT 1 FROM activities a
  WHERE a.user_id = cr.user_id
    AND a.activity_type = 'call'
    AND a.created_at = cr.created_at
);
