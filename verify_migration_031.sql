-- Verification queries for Migration 031

-- 1. Check user_integrations table exists and structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_integrations'
ORDER BY ordinal_position;

-- 2. Check if data was migrated (show count)
SELECT
    'user_integrations (NEW)' as table_name,
    COUNT(*) as row_count,
    MAX(created_at) as latest_entry
FROM user_integrations
WHERE provider = 'google';

-- 3. Check daily_tasks constraint was updated
SELECT pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'daily_tasks_task_type_check';

-- 4. Check RLS policies exist
SELECT
    policyname,
    cmd as command_type
FROM pg_policies
WHERE tablename = 'user_integrations'
ORDER BY policyname;
