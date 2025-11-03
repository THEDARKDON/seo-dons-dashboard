-- =====================================================
-- Migration 035: Make first_name and last_name optional for leads
-- =====================================================
-- Date: 2025-11-02
-- Purpose: Allow CSV imports without first_name/last_name
-- Issue: Database requires NOT NULL but imports should only require email or phone
-- =====================================================

-- Remove NOT NULL constraint from first_name
ALTER TABLE leads
ALTER COLUMN first_name DROP NOT NULL;

-- Remove NOT NULL constraint from last_name
ALTER TABLE leads
ALTER COLUMN last_name DROP NOT NULL;

-- Add check constraint to ensure at least email or phone exists
ALTER TABLE leads
ADD CONSTRAINT leads_contact_required
CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Add comment
COMMENT ON CONSTRAINT leads_contact_required ON leads IS
'At least one contact method (email or phone) must be provided for each lead';
