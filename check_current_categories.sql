-- Check current category values in leads table
SELECT
  category,
  COUNT(*) as lead_count
FROM leads
WHERE category IS NOT NULL
GROUP BY category
ORDER BY lead_count DESC;

-- Show sample leads with categories
SELECT
  id,
  first_name,
  last_name,
  email,
  category,
  created_at
FROM leads
WHERE category IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Check if any leads have NULL categories
SELECT
  COUNT(*) as total_leads,
  COUNT(category) as leads_with_category,
  COUNT(*) - COUNT(category) as leads_without_category
FROM leads;
