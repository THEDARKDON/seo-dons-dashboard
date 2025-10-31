-- CHECK SPECIFIC LEAD TRIGGERS FOR "source" FIELD REFERENCE
-- Based on the list, these are the lead-related triggers:

-- ========================================
-- 1. Check calculate_lead_score
-- ========================================
SELECT 'calculate_lead_score' as function_name, pg_get_functiondef('calculate_lead_score'::regproc) as definition;

-- ========================================
-- 2. Check log_lead_status_change
-- ========================================
SELECT 'log_lead_status_change' as function_name, pg_get_functiondef('log_lead_status_change'::regproc) as definition;

-- ========================================
-- 3. Check notify_on_new_lead
-- ========================================
SELECT 'notify_on_new_lead' as function_name, pg_get_functiondef('notify_on_new_lead'::regproc) as definition;

-- ========================================
-- 4. Check update_lead_on_call
-- ========================================
SELECT 'update_lead_on_call' as function_name, pg_get_functiondef('update_lead_on_call'::regproc) as definition;

-- ========================================
-- 5. Check update_lead_updated_at
-- ========================================
SELECT 'update_lead_updated_at' as function_name, pg_get_functiondef('update_lead_updated_at'::regproc) as definition;

-- ========================================
-- Look for "NEW.source" in the output
-- ========================================
-- When you run these, look for any line that says:
-- NEW.source
-- or
-- OLD.source
--
-- It should say NEW.lead_source instead!
