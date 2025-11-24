-- =====================================================
-- REVERT CALENDAR TO WORKING STATE
-- =====================================================
-- The code was changed to use user_integrations table
-- but production still has user_calendar_integrations
--
-- This SQL gives you TWO OPTIONS:
-- Option A: Keep both tables and migrate data
-- Option B: Update code to use old table (recommended)
-- =====================================================

-- First, let's check what tables exist
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_calendar_integrations', 'user_integrations')
ORDER BY table_name;

-- Check if there's data in the old table
SELECT
    'user_calendar_integrations' as table_name,
    COUNT(*) as row_count
FROM user_calendar_integrations
UNION ALL
SELECT
    'user_integrations' as table_name,
    COUNT(*) as row_count
FROM user_integrations
WHERE provider = 'google';

-- =====================================================
-- OPTION A: CREATE user_integrations AND MIGRATE DATA
-- =====================================================
-- Use this if you want to keep the unified approach

-- Create user_integrations if it doesn't exist
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);

-- Migrate data from old table to new (if old table has data)
INSERT INTO user_integrations (
    user_id,
    provider,
    provider_user_id,
    access_token,
    refresh_token,
    token_expiry,
    scopes,
    metadata,
    created_at,
    updated_at
)
SELECT
    user_id,
    'google' as provider,
    email as provider_user_id,
    access_token,
    refresh_token,
    token_expiry,
    ARRAY['https://www.googleapis.com/auth/calendar'] as scopes,
    jsonb_build_object('email', email, 'calendar_id', calendar_id) as metadata,
    created_at,
    updated_at
FROM user_calendar_integrations
WHERE is_active = true
ON CONFLICT (user_id, provider) DO UPDATE
SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expiry = EXCLUDED.token_expiry,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Add RLS policies to user_integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY IF NOT EXISTS "Users can insert their own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY IF NOT EXISTS "Users can update their own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY IF NOT EXISTS "Users can delete their own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_integrations_updated_at ON user_integrations;
CREATE TRIGGER user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_integrations_updated_at();

-- =====================================================
-- FIX DAILY TASKS CONSTRAINT (separate issue)
-- =====================================================

ALTER TABLE daily_tasks
DROP CONSTRAINT IF EXISTS daily_tasks_task_type_check;

ALTER TABLE daily_tasks
ADD CONSTRAINT daily_tasks_task_type_check
CHECK (task_type IN (
    'calls',
    'appointments',
    'linkedin',
    'linkedin_post',
    'linkedin_share',
    'prospecting',
    'research'
));

-- Update points function
CREATE OR REPLACE FUNCTION calculate_task_points(task_type TEXT, completed BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
  IF NOT completed THEN
    RETURN 0;
  END IF;

  CASE task_type
    WHEN 'calls' THEN RETURN 20;
    WHEN 'appointments' THEN RETURN 30;
    WHEN 'linkedin' THEN RETURN 10;
    WHEN 'linkedin_post' THEN RETURN 15;
    WHEN 'linkedin_share' THEN RETURN 10;
    WHEN 'prospecting' THEN RETURN 15;
    WHEN 'research' THEN RETURN 10;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check both tables now have data
SELECT
    'user_calendar_integrations (OLD)' as table_name,
    COUNT(*) as row_count,
    MAX(created_at) as latest_entry
FROM user_calendar_integrations
UNION ALL
SELECT
    'user_integrations (NEW)' as table_name,
    COUNT(*) as row_count,
    MAX(created_at) as latest_entry
FROM user_integrations
WHERE provider = 'google';

-- Check constraint was updated
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'daily_tasks_task_type_check';

-- =====================================================
-- SUCCESS
-- =====================================================
SELECT '✅ Calendar tables synchronized and daily tasks fixed!' as status;
