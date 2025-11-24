-- =====================================================
-- FIX: Calendar Integration & Email System Issues
-- =====================================================
-- This fixes the 'contact_email' column error and related issues
-- Date: 2025-11-01
-- =====================================================

-- 1. Add missing contact_name and contact_email columns to activities
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_contact_email ON activities(contact_email);
CREATE INDEX IF NOT EXISTS idx_activities_contact_name ON activities(contact_name);

-- 3. Add comments for documentation
COMMENT ON COLUMN activities.contact_name IS 'Contact name when customer_id is not available';
COMMENT ON COLUMN activities.contact_email IS 'Contact email when customer_id is not available';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if columns were added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activities'
  AND column_name IN ('contact_name', 'contact_email')
ORDER BY column_name;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'activities'
  AND indexname LIKE '%contact%'
ORDER BY indexname;

-- =====================================================
-- TEST QUERY
-- =====================================================

-- Test inserting an activity with contact information
-- (This is just for verification, will be rolled back)
DO $$
DECLARE
    test_user_id UUID;
    test_activity_id UUID;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Try to insert a test activity
        INSERT INTO activities (
            user_id,
            activity_type,
            subject,
            description,
            scheduled_at,
            status,
            contact_name,
            contact_email
        ) VALUES (
            test_user_id,
            'appointment',
            'Test Appointment',
            'Testing contact_email column',
            NOW() + INTERVAL '1 day',
            'scheduled',
            'Test Contact',
            'test@example.com'
        )
        RETURNING id INTO test_activity_id;

        RAISE NOTICE 'Test successful! Activity ID: %', test_activity_id;

        -- Clean up test data
        DELETE FROM activities WHERE id = test_activity_id;
        RAISE NOTICE 'Test activity cleaned up';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Calendar and email integration columns added successfully!' AS status;
