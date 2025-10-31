-- ========================================
-- COMPLETE FIX for lead_imports table
-- Adds all missing columns the API expects
-- ========================================

-- Step 1: Add assigned_to column
ALTER TABLE lead_imports
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Add settings column (JSONB for import configuration)
ALTER TABLE lead_imports
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);

-- Step 4: Add comments
COMMENT ON COLUMN lead_imports.assigned_to IS 'Which SDR these leads were assigned to';
COMMENT ON COLUMN lead_imports.settings IS 'Import configuration: skip_duplicates, update_existing, etc.';

-- ========================================
-- VERIFY: Check all required columns exist
-- ========================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lead_imports'
  AND column_name IN ('assigned_to', 'settings', 'import_source', 'total_rows', 'status', 'imported_by')
ORDER BY column_name;

-- Should show all 6 columns

-- ========================================
-- TEST: Try inserting a record (will rollback)
-- ========================================
BEGIN;

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

    -- Try creating a test import record with ALL API-expected columns
    INSERT INTO lead_imports (
        imported_by,
        assigned_to,
        import_source,
        total_rows,
        status,
        settings
    ) VALUES (
        test_user_id,
        test_user_id,
        'csv',
        10,
        'processing',
        '{"skipDuplicates": true}'::jsonb
    )
    RETURNING id INTO test_import_id;

    RAISE NOTICE '✅ Test insert succeeded! Import ID: %', test_import_id;
    RAISE NOTICE '✅ All columns working correctly';
END $$;

ROLLBACK;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '╔════════════════════════════════════════╗';
    RAISE NOTICE '║  Lead Imports Table Fix Complete!     ║';
    RAISE NOTICE '╚════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Added: assigned_to (UUID)';
    RAISE NOTICE '✅ Added: settings (JSONB)';
    RAISE NOTICE '✅ Created indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Update API to use "import_source" instead of "import_type"';
END $$;
