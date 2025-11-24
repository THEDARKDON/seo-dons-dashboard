-- Check if categories are actually in the database

-- 1. Check all leads with categories
SELECT
    id,
    first_name,
    last_name,
    email,
    category,
    updated_at,
    created_at
FROM leads
WHERE category IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- 2. Count leads by category
SELECT
    category,
    COUNT(*) as count
FROM leads
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- 3. Check recently updated leads (should show imports)
SELECT
    id,
    first_name,
    last_name,
    email,
    category,
    updated_at,
    created_at,
    (updated_at > created_at) as was_updated
FROM leads
ORDER BY updated_at DESC
LIMIT 20;

-- 4. Check for seo_instantly_opened specifically
SELECT
    COUNT(*) as seo_instantly_opened_count
FROM leads
WHERE category = 'seo_instantly_opened';

-- 5. Check if leads table has category column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'category';
