-- Fix phone number assignment for +447700158258
-- This will ensure the phone number is properly assigned to the admin user

-- First, check if the phone number is already assigned
SELECT 
    u.id,
    u.clerk_id,
    u.email,
    u.role,
    v.assigned_phone_number,
    v.sms_enabled
FROM users u
LEFT JOIN user_voip_settings v ON u.id = v.user_id
WHERE u.role = 'admin'
ORDER BY u.created_at
LIMIT 1;

-- If the above query shows no phone assignment, run this to assign the phone number
-- Replace 'YOUR_ADMIN_USER_ID' with the actual user ID from the above query
/*
INSERT INTO user_voip_settings (
    user_id, 
    assigned_phone_number, 
    caller_id_number, 
    auto_record, 
    auto_transcribe,
    sms_enabled
)
SELECT 
    id,
    '+447700158258',
    '+447700158258',
    true,
    true,
    true
FROM users
WHERE role = 'admin'
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET
    assigned_phone_number = '+447700158258',
    caller_id_number = '+447700158258',
    sms_enabled = true,
    updated_at = NOW();
*/

-- Verify the assignment
SELECT 
    u.clerk_id,
    u.email,
    v.assigned_phone_number,
    v.sms_enabled,
    v.created_at,
    v.updated_at
FROM users u
JOIN user_voip_settings v ON u.id = v.user_id
WHERE v.assigned_phone_number = '+447700158258';
