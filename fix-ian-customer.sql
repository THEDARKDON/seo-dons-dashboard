-- Fix Ian Sorbie's customer record to assign ownership
-- This will make the customer visible to Jamie McDonald

UPDATE customers
SET owned_by = (
  SELECT assigned_to
  FROM leads
  WHERE email = 'iansorbie@regalprecisioneng.com'
  LIMIT 1
)
WHERE email = 'iansorbie@regalprecisioneng.com'
AND owned_by IS NULL;

-- Verify the fix
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.company,
  c.email,
  c.owned_by,
  u.first_name || ' ' || u.last_name as owner_name
FROM customers c
LEFT JOIN users u ON c.owned_by = u.id
WHERE c.email = 'iansorbie@regalprecisioneng.com';
