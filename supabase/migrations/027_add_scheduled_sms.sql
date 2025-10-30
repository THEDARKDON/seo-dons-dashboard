-- Add scheduled_for column to sms_messages table
ALTER TABLE sms_messages
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add index for querying scheduled messages
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_for
ON sms_messages(scheduled_for)
WHERE status = 'queued';
