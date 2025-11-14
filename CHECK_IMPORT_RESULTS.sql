-- Quick diagnostic to see what happened with your import

-- 1. Check all leads with seo_instantly_opened category
SELECT
    COUNT(*) as total_seo_instantly_opened
FROM leads
WHERE category = 'seo_instantly_opened';

-- 2. Check all leads with instantly_opened category
SELECT
    COUNT(*) as total_instantly_opened
FROM leads
WHERE category = 'instantly_opened';

-- 3. Check all leads updated in last hour (your 300 imports)
SELECT
    id,
    first_name,
    last_name,
    email,
    category,
    status,
    created_at,
    updated_at,
    (updated_at - created_at) as time_difference
FROM leads
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 50;

-- 4. Group by category to see distribution
SELECT
    COALESCE(category, '(no category)') as category,
    COUNT(*) as count
FROM leads
WHERE updated_at > NOW() - INTERVAL '1 hour'
GROUP BY category
ORDER BY count DESC;

-- 5. Check if there are leads without categories
SELECT
    COUNT(*) as leads_without_category
FROM leads
WHERE category IS NULL
  AND updated_at > NOW() - INTERVAL '1 hour';

-- 6. Check most recently updated leads (should be your imports)
SELECT
    id,
    email,
    category,
    updated_at
FROM leads
ORDER BY updated_at DESC
LIMIT 10;
