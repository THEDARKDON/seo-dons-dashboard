-- Auto-update lead status when call is completed
-- This ensures leads show accurate contact status and last_contacted_at timestamp

-- Function to update lead when call is made
CREATE OR REPLACE FUNCTION update_lead_on_call()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed calls with lead_id
  IF (NEW.status = 'completed' OR (NEW.status = 'in-progress' AND NEW.recording_url IS NOT NULL))
     AND NEW.lead_id IS NOT NULL
     AND (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN

    -- Update lead's last_contacted_at and potentially status
    UPDATE leads
    SET
      last_contacted_at = COALESCE(NEW.ended_at, NEW.created_at),
      -- Only change status from 'new' to 'contacted'
      status = CASE
        WHEN status = 'new' THEN 'contacted'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.lead_id;

    -- Create a status_change activity if status changed from new to contacted
    INSERT INTO lead_activities (
      lead_id,
      user_id,
      activity_type,
      subject,
      description,
      created_at
    )
    SELECT
      NEW.lead_id,
      NEW.user_id,
      'status_change',
      'Lead contacted via call',
      CONCAT('Lead status updated to contacted after ',
        CASE
          WHEN NEW.duration_seconds > 0 THEN 'successful call'
          ELSE 'call attempt'
        END,
        ' to ', NEW.to_number),
      NOW()
    FROM leads
    WHERE leads.id = NEW.lead_id
      AND leads.status = 'contacted'
      AND NOT EXISTS (
        -- Avoid duplicate status_change activities within last minute
        SELECT 1 FROM lead_activities
        WHERE lead_id = NEW.lead_id
          AND activity_type = 'status_change'
          AND created_at > NOW() - INTERVAL '1 minute'
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_lead_on_call ON call_recordings;

-- Create trigger
CREATE TRIGGER trigger_update_lead_on_call
  AFTER INSERT OR UPDATE ON call_recordings
  FOR EACH ROW
  WHEN (NEW.lead_id IS NOT NULL)
  EXECUTE FUNCTION update_lead_on_call();

-- Add comments
COMMENT ON FUNCTION update_lead_on_call IS 'Automatically updates lead last_contacted_at and status when a call is completed';
COMMENT ON TRIGGER trigger_update_lead_on_call ON call_recordings IS 'Triggers lead status update when call completes';
