-- Calendar Integration System
-- Allows users to connect their Google Calendar and sync appointments

-- Table: user_calendar_integrations
-- Stores OAuth tokens and calendar connection info
CREATE TABLE IF NOT EXISTS user_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'google', -- 'google', 'outlook', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT, -- Primary calendar ID (usually email)
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add calendar event tracking to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_event_link TEXT,
ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(50);

-- Add calendar event tracking to call_recordings
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_event_link TEXT,
ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meeting_duration INTEGER; -- in minutes

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON user_calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_active ON user_calendar_integrations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_activities_calendar_event ON activities(calendar_event_id) WHERE calendar_event_id IS NOT NULL;

-- Disable RLS on calendar integrations (already protected by Clerk middleware)
ALTER TABLE user_calendar_integrations DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE user_calendar_integrations IS 'Stores Google Calendar OAuth tokens and connection settings for users';
COMMENT ON COLUMN activities.calendar_event_id IS 'Google Calendar event ID for synced appointments';
COMMENT ON COLUMN activities.calendar_event_link IS 'Direct link to calendar event';
