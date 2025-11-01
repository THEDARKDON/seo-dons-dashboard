-- =====================================================
-- Migration 031: Fix Calendar Integration & Daily Tasks
-- =====================================================
-- Date: 2025-11-01
-- Purpose:
--   1. Ensure user_integrations table exists with correct structure
--   2. Migrate existing calendar connections from user_calendar_integrations
--   3. Fix daily_tasks constraint to include linkedin_post/linkedin_share
--   4. Update task points calculation function
-- =====================================================

-- =====================================================
-- PART 1: Create user_integrations Table
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
-- PART 2: Migrate Data from Old Calendar Table
-- =====================================================

-- Migrate existing calendar integrations if old table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'user_calendar_integrations') THEN

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

        RAISE NOTICE 'Migrated calendar integrations from user_calendar_integrations to user_integrations';
    END IF;
END $$;

-- =====================================================
-- PART 3: Add RLS Policies
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
-- PART 4: Add Updated_at Trigger
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
-- PART 5: Fix Daily Tasks Constraint
-- =====================================================

-- Drop old constraint
ALTER TABLE daily_tasks
DROP CONSTRAINT IF EXISTS daily_tasks_task_type_check;

-- Add new constraint with linkedin_post and linkedin_share
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
-- PART 6: Update Points Calculation Function
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
-- PART 7: Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE user_integrations IS 'Unified OAuth integrations table for Gmail, Calendar, and other services';
COMMENT ON COLUMN user_integrations.provider IS 'Service provider: google, microsoft, etc.';
COMMENT ON COLUMN user_integrations.provider_user_id IS 'External user ID from the provider';
COMMENT ON COLUMN user_integrations.scopes IS 'Array of OAuth scopes granted';
COMMENT ON COLUMN user_integrations.metadata IS 'Additional provider data (email, calendar_id, etc.)';

COMMENT ON CONSTRAINT daily_tasks_task_type_check ON daily_tasks IS 'Allowed task types including LinkedIn posting tasks';
