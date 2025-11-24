-- IMMEDIATE FIX: Remove duplicate phone number assignments
-- Currently +447700158258 is assigned to 4 users, causing inbound call issues

-- ========================================
-- STEP 1: See the current duplicate situation
-- ========================================
SELECT
    '=== CURRENT DUPLICATES ===' as info,
    vs.assigned_phone_number,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    vs.created_at as assigned_on
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number = '+447700158258'
ORDER BY vs.created_at;

-- ========================================
-- DECISION: Who should keep +447700158258?
-- ========================================
-- Based on your data, these 4 users have it:
-- 1. Donovan Fawcett (don.f@seodons.co.uk) - admin
-- 2. Jamie McDonald (jamie.m1@seodons.co.uk) - bdr
-- 3. Don Test 2 (fawcettdon27@gmail.com) - bdr (test account?)
-- 4. Don Test (fawcettworks@gmail.com) - bdr (test account?)

-- RECOMMENDATION: Keep it for Jamie McDonald (jamie.m1@seodons.co.uk)
-- since he's a BDR and likely the intended user based on earlier logs

-- ========================================
-- STEP 2: Remove +447700158258 from everyone EXCEPT Jamie
-- ========================================

-- Remove from Donovan Fawcett
UPDATE user_voip_settings
SET
    assigned_phone_number = NULL,
    caller_id_number = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE email = 'don.f@seodons.co.uk'
)
AND assigned_phone_number = '+447700158258';

-- Remove from Don Test 2
UPDATE user_voip_settings
SET
    assigned_phone_number = NULL,
    caller_id_number = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE email = 'fawcettdon27@gmail.com'
)
AND assigned_phone_number = '+447700158258';

-- Remove from Don Test
UPDATE user_voip_settings
SET
    assigned_phone_number = NULL,
    caller_id_number = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE email = 'fawcettworks@gmail.com'
)
AND assigned_phone_number = '+447700158258';

-- KEEP for Jamie McDonald (jamie.m1@seodons.co.uk)
-- (No action needed - already has it)

-- ========================================
-- STEP 3: Verify only Jamie has +447700158258
-- ========================================
SELECT
    '=== VERIFICATION ===' as info,
    COUNT(*) as users_with_this_number,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ SUCCESS - Only 1 user has this number'
        WHEN COUNT(*) > 1 THEN '❌ STILL HAS DUPLICATES!'
        ELSE '⚠️ No users have this number'
    END as status
FROM user_voip_settings
WHERE assigned_phone_number = '+447700158258';

-- Show who has it:
SELECT
    '=== WHO HAS +447700158258 NOW ===' as info,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role,
    vs.assigned_phone_number
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number = '+447700158258';

-- ========================================
-- STEP 4: Assign other numbers to the users who lost theirs
-- ========================================
-- You have these available numbers:
-- +447366312952 (Niall)
-- +447367178338 (Jamie - different one)
-- +447397399803 (Matt)
-- +447476960370 (Andrew)

-- Check if you need to purchase more numbers or reassign existing ones

-- Show all current assignments:
SELECT
    '=== ALL CURRENT ASSIGNMENTS ===' as info,
    vs.assigned_phone_number,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number IS NOT NULL
ORDER BY vs.assigned_phone_number;

-- ========================================
-- OPTION: Assign Donovan to a different number
-- ========================================
-- If Donovan needs a phone number, you can:
-- 1. Purchase a new number from Twilio
-- 2. Assign him one of the existing numbers if available

-- Example: Assign Donovan to +447476960371 (if you purchase it)
/*
UPDATE user_voip_settings
SET
    assigned_phone_number = '+447476960371',
    caller_id_number = '+447476960371',
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE email = 'don.f@seodons.co.uk'
);
*/

-- ========================================
-- FINAL CHECK: No duplicates anywhere
-- ========================================
SELECT
    '=== FINAL DUPLICATE CHECK ===' as info,
    assigned_phone_number,
    COUNT(*) as num_users,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ Unique'
        ELSE '❌ DUPLICATE!'
    END as status
FROM user_voip_settings
WHERE assigned_phone_number IS NOT NULL
GROUP BY assigned_phone_number
HAVING COUNT(*) > 1;
-- Should return 0 rows if all duplicates are fixed
