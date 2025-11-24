-- FIX DUPLICATE PHONE NUMBER ASSIGNMENTS
-- Problem: Multiple users have the same phone number assigned
-- This causes the webhook to fail with "Cannot coerce the result to a single JSON object"

-- ========================================
-- STEP 1: See the duplicate assignments
-- ========================================
SELECT
    '=== DUPLICATE PHONE NUMBERS ===' as info,
    vs.assigned_phone_number,
    COUNT(*) as num_users_with_this_number,
    STRING_AGG(u.first_name || ' ' || u.last_name || ' (' || u.email || ')', ', ') as users
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number IS NOT NULL
GROUP BY vs.assigned_phone_number
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ========================================
-- STEP 2: See ALL assignments with details
-- ========================================
SELECT
    '=== ALL ASSIGNMENTS ===' as info,
    vs.assigned_phone_number,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role,
    vs.created_at,
    vs.updated_at
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number IS NOT NULL
ORDER BY vs.assigned_phone_number, vs.created_at;

-- ========================================
-- STEP 3: Decide who should keep each number
-- ========================================
-- Based on your logs, +447700158258 is assigned to 4 users
-- You need to decide:
-- 1. Who should KEEP +447700158258?
-- 2. What numbers should the other 3 users get?

-- Show available purchased numbers:
-- (You'll need to check Twilio console for this)

-- ========================================
-- OPTION A: Keep the OLDEST assignment
-- ========================================
-- This will remove the number from all users except the one who had it first

WITH duplicates AS (
    SELECT
        vs.assigned_phone_number,
        vs.user_id,
        vs.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY vs.assigned_phone_number
            ORDER BY vs.created_at ASC  -- Keep the oldest
        ) as row_num
    FROM user_voip_settings vs
    WHERE vs.assigned_phone_number IS NOT NULL
)
SELECT
    '=== WILL KEEP THESE ASSIGNMENTS ===' as info,
    d.assigned_phone_number,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    d.created_at as assigned_on
FROM duplicates d
JOIN users u ON u.id = d.user_id
WHERE d.row_num = 1
ORDER BY d.assigned_phone_number;

-- Run this to see WHO WILL LOSE their assignments:
WITH duplicates AS (
    SELECT
        vs.assigned_phone_number,
        vs.user_id,
        vs.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY vs.assigned_phone_number
            ORDER BY vs.created_at ASC
        ) as row_num
    FROM user_voip_settings vs
    WHERE vs.assigned_phone_number IS NOT NULL
)
SELECT
    '=== WILL REMOVE THESE ASSIGNMENTS ===' as info,
    d.assigned_phone_number,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    d.created_at as was_assigned_on
FROM duplicates d
JOIN users u ON u.id = d.user_id
WHERE d.row_num > 1
ORDER BY d.assigned_phone_number;

-- ========================================
-- OPTION B: Manually decide who keeps what
-- ========================================
-- See all 4 users who have +447700158258:

SELECT
    vs.id as voip_settings_id,
    vs.user_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role,
    vs.created_at,
    vs.updated_at,
    '-- Keep this one? Choose ONE to keep' as action
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number = '+447700158258'
ORDER BY vs.created_at;

-- ========================================
-- FIX: Remove duplicates (keep oldest)
-- ========================================
-- ⚠️ ONLY RUN THIS AFTER REVIEWING THE QUERIES ABOVE!

-- This will:
-- 1. Keep the OLDEST assignment for each number
-- 2. Remove the number from all other users (sets to NULL)

-- UNCOMMENT TO RUN:
/*
WITH duplicates AS (
    SELECT
        vs.id,
        ROW_NUMBER() OVER (
            PARTITION BY vs.assigned_phone_number
            ORDER BY vs.created_at ASC  -- Keep oldest
        ) as row_num
    FROM user_voip_settings vs
    WHERE vs.assigned_phone_number IS NOT NULL
)
UPDATE user_voip_settings
SET
    assigned_phone_number = NULL,
    caller_id_number = NULL,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);
*/

-- ========================================
-- ALTERNATIVE: Delete duplicate rows entirely
-- ========================================
-- If you want to DELETE the duplicate rows instead of just clearing the number:

-- UNCOMMENT TO RUN:
/*
WITH duplicates AS (
    SELECT
        vs.id,
        ROW_NUMBER() OVER (
            PARTITION BY vs.assigned_phone_number
            ORDER BY vs.created_at ASC  -- Keep oldest
        ) as row_num
    FROM user_voip_settings vs
    WHERE vs.assigned_phone_number IS NOT NULL
)
DELETE FROM user_voip_settings
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);
*/

-- ========================================
-- MANUAL FIX: Assign specific numbers to specific users
-- ========================================
-- If you want to manually assign each user a different number:

-- Example: Give each of the 4 users their own number
/*
-- User 1 keeps +447700158258
-- (already assigned, do nothing)

-- User 2 gets +447366312952
UPDATE user_voip_settings
SET
    assigned_phone_number = '+447366312952',
    caller_id_number = '+447366312952',
    updated_at = NOW()
WHERE user_id = 'USER_2_ID_HERE';

-- User 3 gets +447367178338
UPDATE user_voip_settings
SET
    assigned_phone_number = '+447367178338',
    caller_id_number = '+447367178338',
    updated_at = NOW()
WHERE user_id = 'USER_3_ID_HERE';

-- User 4 gets +447476960370
UPDATE user_voip_settings
SET
    assigned_phone_number = '+447476960370',
    caller_id_number = '+447476960370',
    updated_at = NOW()
WHERE user_id = 'USER_4_ID_HERE';
*/

-- ========================================
-- VERIFY: Check no more duplicates
-- ========================================
SELECT
    '=== FINAL CHECK: DUPLICATES SHOULD BE 0 ===' as info,
    vs.assigned_phone_number,
    COUNT(*) as num_users,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ OK - Unique'
        ELSE '❌ STILL DUPLICATE!'
    END as status
FROM user_voip_settings vs
WHERE vs.assigned_phone_number IS NOT NULL
GROUP BY vs.assigned_phone_number
ORDER BY COUNT(*) DESC;

-- ========================================
-- FINAL: Show all assignments
-- ========================================
SELECT
    '=== ALL ASSIGNMENTS (AFTER FIX) ===' as info,
    vs.assigned_phone_number,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
WHERE vs.assigned_phone_number IS NOT NULL
ORDER BY vs.assigned_phone_number;
