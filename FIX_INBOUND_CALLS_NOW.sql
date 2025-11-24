-- IMMEDIATE FIX FOR INBOUND CALL ISSUE
-- "This number is not configured. Please contact support."
--
-- Run this entire script in Supabase SQL Editor

-- ========================================
-- STEP 1: Identify the problem
-- ========================================
-- Show all users and their assigned numbers
SELECT
    '=== CURRENT ASSIGNMENTS ===' as info,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role,
    vs.assigned_phone_number as twilio_number,
    CASE
        WHEN vs.assigned_phone_number IS NOT NULL THEN '✅ Has number'
        ELSE '❌ NO NUMBER'
    END as status
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
ORDER BY u.role, u.created_at;

-- ========================================
-- STEP 2: Find unassigned numbers from error logs
-- ========================================
-- Based on your error: +447700158258 is not assigned
-- Check if this number is in the database:

SELECT
    '=== PROBLEMATIC NUMBER ===' as info,
    '+447700158258' as phone_number,
    COUNT(*) as times_assigned,
    CASE
        WHEN COUNT(*) = 0 THEN '❌ NOT ASSIGNED TO ANYONE - THIS IS THE PROBLEM'
        WHEN COUNT(*) = 1 THEN '✅ Assigned to 1 user'
        ELSE '⚠️  WARNING: Assigned to multiple users!'
    END as diagnosis
FROM user_voip_settings
WHERE assigned_phone_number = '+447700158258';

-- ========================================
-- STEP 3: Find Jamie (or the intended user)
-- ========================================
SELECT
    '=== FINDING JAMIE ===' as info,
    id as user_id,
    clerk_id,
    first_name,
    last_name,
    email,
    role
FROM users
WHERE LOWER(first_name) LIKE '%jamie%'
   OR LOWER(last_name) LIKE '%jamie%'
   OR LOWER(email) LIKE '%jamie%';

-- ========================================
-- FIX: Assign +447700158258 to the right user
-- ========================================
-- IMPORTANT: Replace 'jamie@example.com' with the actual email from STEP 3

-- This will work whether the user has voip_settings or not:
INSERT INTO user_voip_settings (
    user_id,
    assigned_phone_number,
    caller_id_number,
    auto_record,
    auto_transcribe,
    voicemail_enabled,
    sms_enabled
)
SELECT
    id,
    '+447700158258',
    '+447700158258',
    true,
    true,
    true,
    true
FROM users
WHERE email = 'REPLACE_WITH_JAMIE_EMAIL_HERE'  -- ⚠️  CHANGE THIS!
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
    assigned_phone_number = EXCLUDED.assigned_phone_number,
    caller_id_number = EXCLUDED.caller_id_number,
    sms_enabled = EXCLUDED.sms_enabled,
    updated_at = NOW();

-- ========================================
-- VERIFY: Check the fix worked
-- ========================================
SELECT
    '=== ✅ VERIFICATION ===' as info,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    vs.assigned_phone_number,
    '✅ Inbound calls to ' || vs.assigned_phone_number || ' will now route to ' || u.first_name as success_message
FROM users u
JOIN user_voip_settings vs ON u.id = vs.user_id
WHERE vs.assigned_phone_number = '+447700158258';

-- ========================================
-- ALTERNATIVE: Assign ALL unassigned numbers at once
-- ========================================
-- If you have multiple numbers to assign, uncomment and modify this:

/*
-- Get list of all Twilio numbers first by running this in terminal:
-- curl -u "AC78b94a2ab848d0ae177f8069688f39ff:7b977424a7e2371209b2eaded8d6f835" \
--   "https://api.twilio.com/2010-04-01/Accounts/AC78b94a2ab848d0ae177f8069688f39ff/IncomingPhoneNumbers.json"

-- Then assign them:
WITH number_assignments AS (
    SELECT * FROM (VALUES
        ('user1@example.com', '+441474554816'),
        ('user2@example.com', '+447700158258'),
        ('user3@example.com', '+441234567890')
    ) AS t(user_email, phone_number)
)
INSERT INTO user_voip_settings (
    user_id,
    assigned_phone_number,
    caller_id_number,
    auto_record,
    auto_transcribe,
    voicemail_enabled,
    sms_enabled
)
SELECT
    u.id,
    na.phone_number,
    na.phone_number,
    true,
    true,
    true,
    true
FROM number_assignments na
JOIN users u ON u.email = na.user_email
ON CONFLICT (user_id) DO UPDATE SET
    assigned_phone_number = EXCLUDED.assigned_phone_number,
    caller_id_number = EXCLUDED.caller_id_number,
    sms_enabled = EXCLUDED.sms_enabled,
    updated_at = NOW();
*/

-- ========================================
-- FINAL CHECK: Show all assignments
-- ========================================
SELECT
    '=== FINAL STATUS ===' as info,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    vs.assigned_phone_number,
    vs.sms_enabled,
    'Inbound calls will route here ✅' as routing
FROM users u
JOIN user_voip_settings vs ON u.id = vs.user_id
WHERE vs.assigned_phone_number IS NOT NULL
ORDER BY vs.assigned_phone_number;

-- ========================================
-- TESTING: Make a test inbound call
-- ========================================
-- After running this script:
-- 1. Call +447700158258 from your phone
-- 2. You should hear it ring in the user's browser (not the error message)
-- 3. Check the logs in Vercel to confirm: "✅ Routing inbound call to user: [clerk_id]"
--
-- If you still hear "This number is not configured":
-- - Wait 30 seconds for cache to clear
-- - Try calling again
-- - Check that the number in Twilio matches exactly (including +44 vs 44)
