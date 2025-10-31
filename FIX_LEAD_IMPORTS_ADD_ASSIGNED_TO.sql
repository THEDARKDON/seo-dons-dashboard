-- ========================================
-- FIX: Add missing assigned_to column to lead_imports
-- Problem: The API tries to insert assigned_to but the column doesn't exist
-- ========================================

-- Step 1: Add the assigned_to column
ALTER TABLE lead_imports
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);

-- Step 3: Add comment
COMMENT ON COLUMN lead_imports.assigned_to IS 'Which SDR these leads were assigned to';

-- ========================================
-- VERIFY: Check the column was added
-- ========================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lead_imports'
  AND column_name = 'assigned_to';

-- Should show: assigned_to | uuid | YES | NULL

-- ========================================
-- TEST: Try inserting a record (will rollback)
-- ========================================
BEGIN;

-- Get a user ID to test with
DO $$
DECLARE
    test_user_id UUID;
    test_import_id UUID;
BEGIN
    -- Get first user
    SELECT id INTO test_user_id FROM users LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found to test with';
        RETURN;
    END IF;

    -- Try creating a test import record
    INSERT INTO lead_imports (
        imported_by,
        assigned_to,
        import_type,
        total_rows,
        status
    ) VALUES (
        test_user_id,
        test_user_id,
        'manual',
        0,
        'pending'
    )
    RETURNING id INTO test_import_id;

    RAISE NOTICE 'Test insert succeeded! Import ID: %', test_import_id;
END $$;

ROLLBACK;
-- ========================================
