-- DIAGNOSTIC QUERIES FOR CALL TRACKING ISSUES
-- Run these queries to identify why calls aren't showing contacts as contacted

-- ========================================
-- 1. CHECK IF TRIGGER EXISTS
-- ========================================
SELECT
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_lead_on_call';

-- ========================================
-- 2. FIND CALLS WITHOUT LEAD/CUSTOMER IDs
-- ========================================
-- These calls won't update contact status because they're not linked
SELECT
    id,
    call_sid,
    to_number,
    from_number,
    direction,
    status,
    lead_id,
    customer_id,
    deal_id,
    created_at,
    ended_at,
    duration_seconds
FROM call_recordings
WHERE lead_id IS NULL
  AND customer_id IS NULL
  AND deal_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- 3. FIND COMPLETED CALLS WITH LEAD_ID BUT LEAD NOT UPDATED
-- ========================================
-- These calls should have triggered the update but didn't
SELECT
    cr.id AS call_id,
    cr.call_sid,
    cr.to_number,
    cr.status AS call_status,
    cr.duration_seconds,
    cr.created_at AS call_created,
    cr.ended_at AS call_ended,
    l.id AS lead_id,
    l.first_name,
    l.last_name,
    l.phone,
    l.status AS lead_status,
    l.last_contacted_at
FROM call_recordings cr
JOIN leads l ON cr.lead_id = l.id
WHERE cr.status IN ('completed', 'in-progress')
  AND (cr.status = 'completed' OR (cr.status = 'in-progress' AND cr.recording_url IS NOT NULL))
  AND (l.last_contacted_at IS NULL OR l.last_contacted_at < cr.created_at)
ORDER BY cr.created_at DESC
LIMIT 20;

-- ========================================
-- 4. FIND LEADS WITH CALLS BUT NEVER CONTACTED
-- ========================================
SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.phone,
    l.status AS lead_status,
    l.last_contacted_at,
    COUNT(cr.id) AS total_calls,
    COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) AS completed_calls,
    MAX(cr.created_at) AS last_call_attempt
FROM leads l
JOIN call_recordings cr ON l.id = cr.lead_id
WHERE l.last_contacted_at IS NULL
GROUP BY l.id, l.first_name, l.last_name, l.phone, l.status, l.last_contacted_at
ORDER BY last_call_attempt DESC;

-- ========================================
-- 5. CHECK PHONE NUMBER MATCHING
-- ========================================
-- Find calls where phone number doesn't match any lead/customer
SELECT DISTINCT
    cr.to_number,
    COUNT(*) AS call_count,
    MAX(cr.created_at) AS last_call,
    EXISTS(SELECT 1 FROM leads WHERE phone = cr.to_number) AS has_matching_lead,
    EXISTS(SELECT 1 FROM customers WHERE phone = cr.to_number) AS has_matching_customer
FROM call_recordings cr
WHERE cr.lead_id IS NULL
  AND cr.customer_id IS NULL
GROUP BY cr.to_number
ORDER BY call_count DESC
LIMIT 20;

-- ========================================
-- 6. FIND POTENTIAL PHONE NUMBER MISMATCHES
-- ========================================
-- Check if phone numbers need formatting/normalization
SELECT
    'Leads' AS source,
    phone,
    first_name,
    last_name,
    LENGTH(phone) AS phone_length,
    CASE
        WHEN phone ~ '^\+1[0-9]{10}$' THEN 'E.164 format (+1XXXXXXXXXX)'
        WHEN phone ~ '^[0-9]{10}$' THEN '10 digits (XXXXXXXXXX)'
        WHEN phone ~ '^\+[0-9]+$' THEN 'International format'
        ELSE 'Non-standard format'
    END AS phone_format
FROM leads
WHERE phone IS NOT NULL
UNION ALL
SELECT
    'Customers' AS source,
    phone,
    first_name,
    last_name,
    LENGTH(phone) AS phone_length,
    CASE
        WHEN phone ~ '^\+1[0-9]{10}$' THEN 'E.164 format (+1XXXXXXXXXX)'
        WHEN phone ~ '^[0-9]{10}$' THEN '10 digits (XXXXXXXXXX)'
        WHEN phone ~ '^\+[0-9]+$' THEN 'International format'
        ELSE 'Non-standard format'
    END AS phone_format
FROM customers
WHERE phone IS NOT NULL
ORDER BY source, phone_length;

-- ========================================
-- 7. COMPARE CALL NUMBERS WITH CONTACT NUMBERS
-- ========================================
-- This helps identify if calls are made to different numbers than stored
SELECT
    cr.to_number AS called_number,
    COALESCE(l.phone, c.phone) AS stored_number,
    COALESCE(l.first_name, c.first_name) || ' ' || COALESCE(l.last_name, c.last_name) AS contact_name,
    cr.status,
    cr.created_at
FROM call_recordings cr
LEFT JOIN leads l ON cr.lead_id = l.id
LEFT JOIN customers c ON cr.customer_id = c.id
WHERE cr.to_number != COALESCE(l.phone, c.phone)
  AND (l.id IS NOT NULL OR c.id IS NOT NULL)
ORDER BY cr.created_at DESC
LIMIT 20;
