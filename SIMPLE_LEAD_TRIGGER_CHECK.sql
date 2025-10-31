-- SIMPLE LEAD SOURCE TRIGGER DIAGNOSTIC
-- No aggregate functions - just simple queries

-- ========================================
-- STEP 1: Check if "source" column exists (it shouldn't!)
-- ========================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('source', 'lead_source')
ORDER BY column_name;

-- Expected result:
-- lead_source | exists ✅
-- source      | should NOT exist ❌

-- ========================================
-- STEP 2: Find ALL triggers on leads table
-- ========================================
SELECT
    trigger_name,
    event_manipulation as "when",
    action_timing as timing,
    action_statement as function_called
FROM information_schema.triggers
WHERE event_object_table = 'leads'
ORDER BY trigger_name;

-- ========================================
-- STEP 3: Check RLS policies on leads
-- ========================================
SELECT
    policyname as policy_name,
    cmd as operation,
    qual as using_check,
    with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- ========================================
-- STEP 4: Test if we can insert with lead_source
-- ========================================
-- This will show the EXACT error message

-- First, get a valid user ID:
SELECT
    '=== GETTING USER ID FOR TEST ===' as info,
    id as user_id,
    email
FROM users
LIMIT 1;

-- Copy the user_id from above and use it below:

-- Try to insert a test lead:
-- (REPLACE 'USER_ID_HERE' with actual ID from query above)
/*
INSERT INTO leads (
    first_name,
    last_name,
    email,
    lead_source,
    status,
    assigned_to
) VALUES (
    'Test',
    'Lead',
    'test-' || NOW()::text || '@example.com',
    'Manual',
    'new',
    'USER_ID_HERE'
);
*/

-- If this fails, copy the EXACT error message

-- Clean up after testing:
/*
DELETE FROM leads WHERE email LIKE 'test-%@example.com';
*/

-- ========================================
-- STEP 5: Check for computed columns or generated columns
-- ========================================
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable,
    is_generated
FROM information_schema.columns
WHERE table_name = 'leads'
  AND (column_name LIKE '%source%' OR is_generated = 'ALWAYS')
ORDER BY ordinal_position;

-- ========================================
-- STEP 6: List ALL functions that might be triggers
-- ========================================
SELECT
    p.proname as function_name,
    n.nspname as schema_name,
    'Function type: ' || p.prorettype::regtype::text as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prorettype = 'trigger'::regtype
ORDER BY p.proname;

-- Now manually check each function:
-- For each function_name from above, run:
/*
SELECT pg_get_functiondef('function_name_here'::regproc);
*/

-- Look for any that reference "NEW.source" or "source" in the function body

-- ========================================
-- QUICK FIX: If you find the problem
-- ========================================

-- If a trigger function uses NEW.source, drop and recreate:
/*
-- Example:
DROP TRIGGER IF EXISTS trigger_name_here ON leads CASCADE;
DROP FUNCTION IF EXISTS function_name_here() CASCADE;
*/

-- If an RLS policy uses "source", drop it:
/*
-- Example:
DROP POLICY IF EXISTS policy_name_here ON leads;
*/

-- ========================================
-- FINAL: Verify the fix
-- ========================================
-- After fixing, try insert again:
/*
INSERT INTO leads (
    first_name,
    last_name,
    email,
    lead_source,
    status,
    assigned_to
) VALUES (
    'Test',
    'Lead',
    'final-test@example.com',
    'Manual',
    'new',
    (SELECT id FROM users LIMIT 1)
);

-- Should succeed!

-- Clean up:
DELETE FROM leads WHERE email = 'final-test@example.com';
*/
