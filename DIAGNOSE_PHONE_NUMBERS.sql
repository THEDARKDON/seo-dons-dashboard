-- Diagnose Phone Number Configuration Issues
-- Run this in Supabase SQL Editor to identify the problem

-- ========================================
-- STEP 1: See ALL users and their assigned phone numbers
-- ========================================
SELECT
    u.id as user_id,
    u.clerk_id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    vs.assigned_phone_number,
    vs.caller_id_number,
    vs.sms_enabled,
    vs.created_at as number_assigned_at
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
ORDER BY u.created_at;

-- ========================================
-- STEP 2: See which numbers are in Twilio but NOT assigned
-- ========================================
-- You'll need to run this cURL command in your terminal to see all Twilio numbers:
/*
curl -u "AC78b94a2ab848d0ae177f8069688f39ff:7b977424a7e2371209b2eaded8d6f835" \
  "https://api.twilio.com/2010-04-01/Accounts/AC78b94a2ab848d0ae177f8069688f39ff/IncomingPhoneNumbers.json"
*/

-- Then compare with the query above to find unassigned numbers

-- ========================================
-- STEP 3: Check recent inbound call attempts
-- ========================================
SELECT
    id,
    call_sid,
    direction,
    from_number,
    to_number,
    status,
    user_id,
    created_at,
    CASE
        WHEN user_id IS NULL THEN '❌ NO USER ASSIGNED'
        ELSE '✅ User found'
    END as routing_status
FROM call_recordings
WHERE direction = 'inbound'
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- STEP 4: Find the problematic number from error logs
-- ========================================
-- Based on your earlier error log, +447700158258 had no user
-- Let's check if it's assigned now:

SELECT
    '+447700158258' as phone_number,
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    vs.assigned_phone_number,
    CASE
        WHEN vs.assigned_phone_number = '+447700158258' THEN '✅ Correctly assigned'
        WHEN vs.assigned_phone_number IS NULL THEN '❌ NOT ASSIGNED'
        ELSE '⚠️  Assigned to different number: ' || vs.assigned_phone_number
    END as status
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
WHERE LOWER(u.first_name) LIKE '%jamie%'
   OR LOWER(u.last_name) LIKE '%jamie%'
   OR LOWER(u.email) LIKE '%jamie%'
   OR vs.assigned_phone_number = '+447700158258';

-- ========================================
-- STEP 5: List ALL numbers that need assignment
-- ========================================
-- This shows you which users don't have phone numbers yet
SELECT
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    CASE
        WHEN vs.assigned_phone_number IS NOT NULL THEN '✅ Has number: ' || vs.assigned_phone_number
        ELSE '❌ NO NUMBER ASSIGNED'
    END as phone_status
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
ORDER BY u.role, u.created_at;

-- ========================================
-- FIX: Assign the problematic number to Jamie
-- ========================================
-- First, find Jamie's user_id from STEP 4 above, then run ONE of these:

-- Option A: If Jamie already has voip_settings but wrong number (UPDATE)
/*
UPDATE user_voip_settings
SET
    assigned_phone_number = '+447700158258',
    caller_id_number = '+447700158258',
    sms_enabled = true,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users
    WHERE LOWER(first_name) LIKE '%jamie%'
       OR LOWER(last_name) LIKE '%jamie%'
       OR LOWER(email) LIKE '%jamie%'
    LIMIT 1
);
*/

-- Option B: If Jamie has no voip_settings at all (INSERT)
/*
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
WHERE LOWER(first_name) LIKE '%jamie%'
   OR LOWER(last_name) LIKE '%jamie%'
   OR LOWER(email) LIKE '%jamie%'
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET
    assigned_phone_number = '+447700158258',
    caller_id_number = '+447700158258',
    sms_enabled = true,
    updated_at = NOW();
*/

-- ========================================
-- VERIFY: Check the assignment worked
-- ========================================
SELECT
    u.first_name,
    u.last_name,
    u.email,
    vs.assigned_phone_number,
    vs.caller_id_number,
    vs.sms_enabled,
    '✅ FIXED - Inbound calls to this number will now route to this user' as status
FROM users u
JOIN user_voip_settings vs ON u.id = vs.user_id
WHERE vs.assigned_phone_number = '+447700158258';

-- ========================================
-- OPTIONAL: Assign multiple numbers at once
-- ========================================
-- If you have multiple numbers to assign, you can do them all:
/*
-- Example: Assign specific numbers to specific users
UPDATE user_voip_settings vs
SET
    assigned_phone_number = mapping.phone_number,
    caller_id_number = mapping.phone_number,
    sms_enabled = true,
    updated_at = NOW()
FROM (VALUES
    ('user_email_1@example.com', '+441474554816'),
    ('user_email_2@example.com', '+447700158258'),
    ('user_email_3@example.com', '+441234567890')
) AS mapping(user_email, phone_number)
JOIN users u ON u.email = mapping.user_email
WHERE vs.user_id = u.id;
*/

-- ========================================
-- HELPFUL: Show the webhook routing logic
-- ========================================
-- This is what happens when an inbound call comes in:
-- 1. Twilio sends webhook to /api/webhooks/twilio/voice
-- 2. Webhook looks up: SELECT id FROM users WHERE assigned_phone_number = <to_number>
-- 3. If found → route call to user
-- 4. If NOT found → error: "No user found for number"

SELECT
    'Webhook expects this mapping:' as info,
    vs.assigned_phone_number as twilio_number,
    '→ routes to →' as arrow,
    u.first_name || ' ' || u.last_name as user_name,
    u.email
FROM user_voip_settings vs
JOIN users u ON vs.user_id = u.id
WHERE vs.assigned_phone_number IS NOT NULL
ORDER BY vs.assigned_phone_number;
