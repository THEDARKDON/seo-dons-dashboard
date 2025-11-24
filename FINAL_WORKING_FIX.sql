-- =====================================================
-- FINAL WORKING FIX - Calendar Integration & Daily Tasks
-- =====================================================
-- This fixes:
-- 1. Calendar integration table mismatch
-- 2. Daily tasks constraint for linkedin_post
-- =====================================================

-- =====================================================
-- PART 1: Check Current State
-- =====================================================

-- Check what tables exist
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
    'user_calendar_integrations (OLD)' as table_name,
    COUNT(*) as row_count
FROM user_calendar_integrations
UNION ALL
SELECT
    'user_integrations (NEW)' as table_name,
    COUNT(*) as row_count
FROM user_integrations
WHERE provider = 'google';

-- =====================================================
-- PART 2: Create user_integrations Table
-- =====================================================

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

-- =====================================================
-- PART 3: Migrate Data from Old Table
-- =====================================================

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

-- =====================================================
-- PART 4: Add RLS Policies (Drop if exists first)
-- =====================================================

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can insert their own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON user_integrations;

-- Create policies
CREATE POLICY "Users can view their own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- =====================================================
-- PART 5: Add Updated_at Trigger
-- =====================================================

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
-- PART 6: Fix Daily Tasks Constraint
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

-- =====================================================
-- PART 7: Update Points Calculation Function
-- =====================================================

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
-- PART 8: Verification Queries
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
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'daily_tasks_task_type_check';

-- Check RLS policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'user_integrations'
ORDER BY policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Calendar integration migrated and daily tasks fixed!' as status;
