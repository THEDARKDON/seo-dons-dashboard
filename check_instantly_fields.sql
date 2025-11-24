-- Check if instantly tracking fields exist in leads table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('instantly_campaign_id', 'instantly_lead_id', 'instantly_status')
ORDER BY column_name;

-- If the above query returns 0 rows, run Migration 037
