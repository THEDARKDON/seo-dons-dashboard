-- =====================================================
-- Verify Migration 038: Check if category column exists
-- =====================================================
-- Run this in Supabase SQL Editor to check if migration is needed

-- Check if category column exists in leads table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name = 'category';

-- If the above query returns 0 rows, you need to run the migration
-- If it returns 1 row, the migration is already applied

-- Check if index exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leads'
  AND indexname = 'idx_leads_category';

-- Check some sample leads to see if they have categories
SELECT
  id,
  first_name,
  last_name,
  email,
  category
FROM leads
LIMIT 10;
