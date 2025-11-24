-- Add recording_duration column to call_recordings table
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS recording_duration INTEGER;

COMMENT ON COLUMN call_recordings.recording_duration IS 'Duration of the recording in seconds';
