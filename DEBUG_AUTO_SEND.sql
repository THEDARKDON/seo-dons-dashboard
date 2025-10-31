-- DEBUG AUTO-SEND: Run this to check why messages aren't being sent
-- Copy and paste into Supabase SQL Editor

-- ========================================
-- CHECK 1: Verify templates exist and are active
-- ========================================

SELECT
    'SMS Templates' as type,
    name,
    category,
    is_active,
    auto_send_after_call,
    auto_send_delay_minutes,
    user_id
FROM sms_templates
WHERE auto_send_after_call = true
ORDER BY created_at DESC;

SELECT
    'Email Templates' as type,
    name,
    category,
    is_active,
    auto_send_after_call,
    user_id
FROM email_templates
WHERE auto_send_after_call = true
ORDER BY created_at DESC;

-- ========================================
-- CHECK 2: Look at recent calls
-- ========================================

SELECT
    id,
    call_sid,
    status,
    duration_seconds,
    lead_id,
    customer_id,
    user_id,
    created_at,
    ended_at
FROM call_recordings
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- CHECK 3: Check if any SMS/Email messages were created
-- ========================================

SELECT
    'SMS Messages' as type,
    id,
    to_number,
    body,
    status,
    direction,
    call_id,
    scheduled_for,
    created_at
FROM sms_messages
ORDER BY created_at DESC
LIMIT 5;

SELECT
    'Email Messages' as type,
    id,
    to_email,
    subject,
    status,
    direction,
    call_id,
    created_at
FROM email_messages
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- CHECK 4: Verify lead has contact info
-- ========================================

-- Get the most recent call's lead
WITH recent_call AS (
    SELECT lead_id, customer_id
    FROM call_recordings
    WHERE lead_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.email,
    l.phone_number,
    l.company,
    'Lead has ' ||
    CASE
        WHEN l.email IS NOT NULL AND l.phone_number IS NOT NULL THEN 'both email and phone ✓'
        WHEN l.email IS NOT NULL THEN 'only email'
        WHEN l.phone_number IS NOT NULL THEN 'only phone'
        ELSE 'NO CONTACT INFO ✗'
    END as contact_status
FROM leads l
WHERE l.id = (SELECT lead_id FROM recent_call);

-- ========================================
-- CHECK 5: Verify user has Twilio number and Gmail
-- ========================================

SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    vs.assigned_phone_number as twilio_number,
    CASE
        WHEN vs.assigned_phone_number IS NOT NULL THEN '✓ Has Twilio number'
        ELSE '✗ NO Twilio number configured'
    END as twilio_status,
    CASE
        WHEN ui.id IS NOT NULL THEN '✓ Gmail connected'
        ELSE '✗ Gmail NOT connected'
    END as gmail_status,
    ui.metadata->>'email' as gmail_email
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
LEFT JOIN user_integrations ui ON u.id = ui.user_id AND ui.provider = 'google'
WHERE u.role = 'admin' OR u.id = (
    SELECT user_id FROM call_recordings ORDER BY created_at DESC LIMIT 1
)
LIMIT 5;

-- ========================================
-- CHECK 6: Test auto-send endpoint was called
-- ========================================

-- This will show us if the webhook is even trying to call auto-send
-- Look at the most recent call and check its status
SELECT
    'Recent Call Status' as info,
    call_sid,
    status,
    'Status should trigger auto-send: ' ||
    CASE
        WHEN status IN ('completed', 'no-answer', 'busy', 'failed') THEN '✓ YES'
        ELSE '✗ NO (status: ' || status || ')'
    END as should_trigger,
    created_at
FROM call_recordings
ORDER BY created_at DESC
LIMIT 1;

-- ========================================
-- SUMMARY
-- ========================================

DO $$
DECLARE
    template_count INTEGER;
    recent_sms_count INTEGER;
    recent_email_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM sms_templates WHERE auto_send_after_call = true;
    SELECT COUNT(*) INTO recent_sms_count FROM sms_messages WHERE created_at > NOW() - INTERVAL '1 hour';
    SELECT COUNT(*) INTO recent_email_count FROM email_messages WHERE created_at > NOW() - INTERVAL '1 hour';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUTO-SEND DEBUG SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auto-send SMS templates: %', template_count;
    RAISE NOTICE 'SMS messages created (last hour): %', recent_sms_count;
    RAISE NOTICE 'Email messages created (last hour): %', recent_email_count;
    RAISE NOTICE '========================================';

    IF template_count = 0 THEN
        RAISE NOTICE '⚠️  NO TEMPLATES - Run HOTFIX_NOW.sql again';
    END IF;

    IF recent_sms_count = 0 AND recent_email_count = 0 THEN
        RAISE NOTICE '⚠️  NO MESSAGES CREATED - Check:';
        RAISE NOTICE '   1. Lead has phone/email';
        RAISE NOTICE '   2. User has Twilio number';
        RAISE NOTICE '   3. User has Gmail connected';
        RAISE NOTICE '   4. Webhook is calling auto-send endpoint';
    END IF;
END $$;
