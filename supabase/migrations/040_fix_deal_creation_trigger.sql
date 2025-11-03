-- Migration 040: Fix deal creation trigger that references non-existent fields
-- The auto_create_customer_from_deal trigger tries to access fields that don't exist:
-- - NEW.contact_name
-- - NEW.contact_email
-- - NEW.contact_phone
-- - NEW.lead_id
-- This causes ALL deal creations to fail with PGRST204 or 42703 errors

-- SOLUTION: Simply drop the problematic trigger and function
-- The trigger was trying to auto-create customers from deals, but:
-- 1. Deals created from customer page already have customer_id
-- 2. Deals created from deals page can optionally link to customer
-- 3. Lead-to-customer conversion should happen explicitly via "Convert Lead" action

-- Drop the problematic trigger and function completely
DROP TRIGGER IF EXISTS trigger_auto_create_customer_from_deal ON deals;
DROP FUNCTION IF EXISTS auto_create_customer_from_deal();

-- Add comment explaining why we removed it
COMMENT ON TABLE deals IS 'Deals table - trigger for auto-creating customers was removed in Migration 040 due to referencing non-existent fields';
