-- FIX LEAD SOURCE TRIGGER ERROR
-- Error: record "new" has no field "source"
-- This happens when a trigger tries to access NEW.source instead of NEW.lead_source

-- ========================================
-- STEP 1: Find the problematic trigger
-- ========================================
SELECT
    '=== TRIGGERS ON LEADS TABLE ===' as info,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'leads'
ORDER BY trigger_name;

-- ========================================
-- STEP 2: Check trigger functions
-- ========================================
-- Look for any function that references "source" field
SELECT
    '=== TRIGGER FUNCTIONS THAT MIGHT REFERENCE SOURCE ===' as info,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%source%'
  AND pg_get_functiondef(p.oid) LIKE '%leads%'
ORDER BY p.proname;

-- ========================================
-- STEP 3: Show the leads table schema
-- ========================================
SELECT
    '=== LEADS TABLE COLUMNS ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name LIKE '%source%'
ORDER BY ordinal_position;

-- ========================================
-- COMMON ISSUE: Auto-populate trigger
-- ========================================
-- If there's a trigger that auto-populates fields based on "source",
-- it needs to be updated to use "lead_source" instead

-- Example of what the trigger might look like (to be dropped):
/*
CREATE OR REPLACE FUNCTION process_lead_source()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source IS NULL THEN  -- ← WRONG! Should be NEW.lead_source
    NEW.source := 'Manual';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- ========================================
-- FIX: Update or drop the trigger
-- ========================================

-- Option 1: If you find a trigger with "source" in it, drop it:
-- (Replace 'trigger_name_here' with the actual trigger name from STEP 1)
/*
DROP TRIGGER IF EXISTS trigger_name_here ON leads;
*/

-- Option 2: If it's a function, drop and recreate it with correct field name:
/*
DROP FUNCTION IF EXISTS process_lead_source() CASCADE;

CREATE OR REPLACE FUNCTION process_lead_source()
RETURNS TRIGGER AS $$
BEGIN
  -- Use lead_source instead of source
  IF NEW.lead_source IS NULL THEN
    NEW.lead_source := 'Manual';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_lead_insert
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION process_lead_source();
*/

-- ========================================
-- ALTERNATIVE: The issue might be in RLS policies
-- ========================================
SELECT
    '=== RLS POLICIES ON LEADS TABLE ===' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- If a policy references "source" field, it needs to be updated:
/*
-- Example of dropping and recreating a policy:
DROP POLICY IF EXISTS policy_name_here ON leads;

CREATE POLICY policy_name_here ON leads
  FOR INSERT
  WITH CHECK (lead_source IS NOT NULL);  -- Use lead_source, not source
*/

-- ========================================
-- VERIFY: Test insert without trigger
-- ========================================
-- Temporarily disable all triggers and try insert:
/*
ALTER TABLE leads DISABLE TRIGGER ALL;

-- Try inserting a test lead:
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
    'test@example.com',
    'Manual',
    'new',
    (SELECT id FROM users LIMIT 1)
);

-- If successful, the trigger is the problem
-- If still fails, it's a different issue

-- Clean up test:
DELETE FROM leads WHERE email = 'test@example.com';

-- Re-enable triggers:
ALTER TABLE leads ENABLE TRIGGER ALL;
*/

-- ========================================
-- FINAL CHECK: Verify column name
-- ========================================
SELECT
    '=== FINAL VERIFICATION ===' as info,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'leads' AND column_name = 'lead_source'
        ) THEN '✅ lead_source column exists'
        ELSE '❌ lead_source column missing!'
    END as lead_source_status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'leads' AND column_name = 'source'
        ) THEN '⚠️ WARNING: "source" column exists (should not!)'
        ELSE '✅ No "source" column (correct)'
    END as source_status;
