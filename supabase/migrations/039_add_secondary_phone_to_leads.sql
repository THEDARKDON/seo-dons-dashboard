-- Migration 039: Add secondary phone field to leads table
-- Purpose: Allow leads to have a second phone number

-- Add secondary phone field
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS phone_secondary TEXT;

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_leads_phone_secondary ON leads(phone_secondary);

-- Add comment
COMMENT ON COLUMN leads.phone_secondary IS 'Secondary/alternate phone number for the lead';
