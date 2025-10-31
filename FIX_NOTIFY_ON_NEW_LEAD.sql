-- FIX: notify_on_new_lead trigger function
-- Problem: References NEW.source instead of NEW.lead_source
-- Line 18: 'Source: ' || COALESCE(NEW.source, 'Unknown')

-- ========================================
-- STEP 1: Drop the old function
-- ========================================
DROP FUNCTION IF EXISTS public.notify_on_new_lead() CASCADE;

-- ========================================
-- STEP 2: Create the corrected function
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_on_new_lead()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Notify assigned user of new lead
    IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            action_url
        ) VALUES (
            NEW.assigned_to,
            'new_lead',
            'New lead assigned: ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.company, 'Unknown'),
            'Source: ' || COALESCE(NEW.lead_source, 'Unknown'),  -- ✅ FIXED: Changed from NEW.source to NEW.lead_source
            'lead',
            NEW.id,
            '/dashboard/leads/' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$function$;

-- ========================================
-- STEP 3: Recreate the trigger
-- ========================================
-- Find the trigger name first
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'leads'
  AND action_statement LIKE '%notify_on_new_lead%';

-- Based on common naming, it's likely:
DROP TRIGGER IF EXISTS notify_on_new_lead_trigger ON leads;
DROP TRIGGER IF EXISTS on_lead_created ON leads;
DROP TRIGGER IF EXISTS trigger_notify_on_new_lead ON leads;

-- Recreate the trigger
CREATE TRIGGER notify_on_new_lead_trigger
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_lead();

-- ========================================
-- STEP 4: Test the fix
-- ========================================
-- Try creating a lead now:
/*
INSERT INTO leads (
    first_name,
    last_name,
    email,
    lead_source,  -- ✅ Using correct column name
    status,
    assigned_to
) VALUES (
    'Test',
    'Lead',
    'test-final@example.com',
    'Manual',
    'new',
    (SELECT id FROM users LIMIT 1)
);

-- Should succeed!

-- Verify notification was created:
SELECT
    title,
    message,
    created_at
FROM notifications
WHERE message LIKE '%Source: Manual%'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up test:
DELETE FROM leads WHERE email = 'test-final@example.com';
*/

-- ========================================
-- VERIFY: Check the function is correct now
-- ========================================
SELECT pg_get_functiondef('notify_on_new_lead'::regproc);

-- Look for "NEW.lead_source" (correct) not "NEW.source" (wrong)
