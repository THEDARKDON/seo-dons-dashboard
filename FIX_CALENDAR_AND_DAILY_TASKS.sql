-- =====================================================
-- FIX: Calendar Integration & Daily Tasks Issues
-- =====================================================
-- Fixes:
-- 1. LinkedIn daily task constraint violation
-- 2. Calendar integration status check
-- Date: 2025-11-01
-- =====================================================

-- =====================================================
-- PART 1: Fix Daily Tasks Constraint
-- =====================================================

-- Drop the old constraint
ALTER TABLE daily_tasks
DROP CONSTRAINT IF EXISTS daily_tasks_task_type_check;

-- Add new constraint with linkedin_post included
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

-- Update the points calculation function to include new task types
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
-- PART 2: Check Calendar Integration Setup
-- =====================================================

-- Verify user_integrations table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_integrations'
ORDER BY ordinal_position;

-- Check if any calendar integrations exist
SELECT
    ui.id,
    ui.user_id,
    ui.provider,
    ui.provider_account_id,
    ui.created_at,
    u.first_name,
    u.last_name,
    u.email
FROM user_integrations ui
JOIN users u ON ui.user_id = u.id
WHERE ui.provider = 'google'
ORDER BY ui.created_at DESC;

-- =====================================================
-- VERIFICATION: Daily Tasks
-- =====================================================

-- Check constraint was updated
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'daily_tasks'::regclass
  AND conname = 'daily_tasks_task_type_check';

-- Test inserting a linkedin_post task (will be rolled back)
DO $$
DECLARE
    test_user_id UUID;
    test_task_id UUID;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO test_user_id FROM users WHERE role IN ('bdr', 'manager') LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Try to insert a test task
        INSERT INTO daily_tasks (
            user_id,
            task_date,
            task_type,
            target_value,
            current_value
        ) VALUES (
            test_user_id,
            CURRENT_DATE,
            'linkedin_post',
            1,
            0
        )
        RETURNING id INTO test_task_id;

        RAISE NOTICE 'Test successful! Task ID: %', test_task_id;

        -- Clean up test data
        DELETE FROM daily_tasks WHERE id = test_task_id;
        RAISE NOTICE 'Test task cleaned up';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

-- =====================================================
-- CALENDAR INTEGRATION TROUBLESHOOTING
-- =====================================================

-- If no Google Calendar integrations exist, check:

-- 1. Is the OAuth callback working?
-- Check the calendar_integrations (old table) if it exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'calendar_integrations'
) AS old_table_exists;

-- 2. Check if any OAuth tokens exist
SELECT
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('user_integrations', 'calendar_integrations')
  AND column_name LIKE '%token%'
ORDER BY table_name, column_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Daily tasks constraint updated. Check calendar integration results above.' AS status;
