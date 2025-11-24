-- =====================================================
-- Migration 038: Add Lead Categories
-- =====================================================
-- Date: 2025-11-02
-- Purpose: Allow manual categorization of leads by source/type
-- =====================================================

-- Add category field to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);

-- Add comment
COMMENT ON COLUMN leads.category IS 'Manual lead categorization: cold, warm, hot, instantly_opened, etc.';
