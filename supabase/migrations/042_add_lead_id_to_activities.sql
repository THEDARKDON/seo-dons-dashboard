-- Add lead_id to activities table to complete data relationship chain
-- This ensures activities can be properly linked back to leads before customer conversion

-- Add lead_id column to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);

-- Update the sync function to include lead_id
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
      lead_id,
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
      NEW.lead_id,
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
      lead_id = NEW.lead_id,
      completed_at = CASE WHEN NEW.status = 'completed' THEN NEW.created_at ELSE NULL END
    WHERE user_id = NEW.user_id
      AND activity_type = 'call'
      AND created_at = NEW.created_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill lead_id for existing activities from call_recordings
UPDATE activities a
SET lead_id = cr.lead_id
FROM call_recordings cr
WHERE a.activity_type = 'call'
  AND a.user_id = cr.user_id
  AND a.created_at = cr.created_at
  AND a.lead_id IS NULL
  AND cr.lead_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN activities.lead_id IS 'Foreign key to leads table, allowing activities to be linked to leads before customer conversion';
