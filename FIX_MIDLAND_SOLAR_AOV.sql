-- ============================================================================
-- FIX MIDLAND SOLAR AOV - Set Average Deal Size to £9,000
-- ============================================================================

-- Step 1: Check current values
SELECT
  id,
  company,
  average_deal_size,
  profit_per_deal,
  conversion_rate,
  created_at
FROM customers
WHERE company = 'midland-solar.co.uk';

-- Expected result: average_deal_size is NULL or 0

-- ============================================================================
-- Step 2: Update with correct business metrics
-- ============================================================================

UPDATE customers
SET
  average_deal_size = 9000.00,    -- £9,000 average order value
  profit_per_deal = 4500.00,      -- £4,500 profit (50% margin)
  conversion_rate = 0.35          -- 35% lead-to-customer conversion
WHERE company = 'midland-solar.co.uk';

-- ============================================================================
-- Step 3: Verify the update
-- ============================================================================

SELECT
  company,
  average_deal_size,
  profit_per_deal,
  conversion_rate,
  updated_at
FROM customers
WHERE company = 'midland-solar.co.uk';

-- Expected result:
-- company              | average_deal_size | profit_per_deal | conversion_rate
-- ---------------------+-------------------+-----------------+----------------
-- midland-solar.co.uk  | 9000.00           | 4500.00         | 0.35

-- ============================================================================
-- Step 4: Check ALL customers missing AOV
-- ============================================================================

SELECT
  company,
  average_deal_size,
  profit_per_deal,
  conversion_rate,
  CASE
    WHEN average_deal_size IS NULL THEN '❌ Missing AOV'
    WHEN average_deal_size = 0 THEN '⚠️  Zero AOV'
    ELSE '✅ Has AOV'
  END as aov_status,
  created_at
FROM customers
WHERE average_deal_size IS NULL
   OR average_deal_size = 0
ORDER BY created_at DESC
LIMIT 20;

-- This shows which other customers need AOV set

-- ============================================================================
-- IMPORTANT: After running this SQL
-- ============================================================================
-- 1. Re-generate the proposal for Midland Solar
-- 2. Check Vercel logs for:
--    - "average_deal_size: 9000.00" (from database)
--    - "averageDealSize: 9000" (after Number() conversion)
--    - "Average Deal Value: £9,000" (in projection calculation)
-- 3. Verify revenue shows:
--    - Month 3: £45,000 (5 customers × £9,000) ✅
--    - Month 6: £72,000 (8 customers × £9,000) ✅
--    - Month 12: £117,000 (13 customers × £9,000) ✅
