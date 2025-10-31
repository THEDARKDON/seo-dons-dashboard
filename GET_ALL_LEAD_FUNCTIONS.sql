-- Get ALL lead trigger function definitions at once

SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
    'calculate_lead_score',
    'log_lead_status_change',
    'notify_on_new_lead',
    'update_lead_on_call',
    'update_lead_updated_at'
)
AND n.nspname = 'public'
ORDER BY p.proname;
