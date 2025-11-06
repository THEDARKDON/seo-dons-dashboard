-- Manual conversion of Ian Sorbie lead to customer
-- Use this if the automatic conversion failed

-- First, get Jamie's user ID
-- Replace 'JAMIE_USER_ID' below with the actual UUID from this query:
SELECT id, first_name, last_name FROM users WHERE first_name = 'Jamie' AND last_name = 'Mcdonald';

-- Step 1: Create the customer record
INSERT INTO customers (
  first_name,
  last_name,
  email,
  phone,
  company,
  job_title,
  website,
  linkedin_url,
  address,
  city,
  state,
  postal_code,
  country,
  industry,
  notes,
  status,
  owned_by
)
SELECT
  first_name,
  last_name,
  email,
  phone,
  company,
  job_title,
  website,
  linkedin_url,
  address,
  city,
  state,
  postal_code,
  country,
  industry,
  notes,
  'active' as status,
  assigned_to as owned_by  -- This assigns to whoever the lead was assigned to
FROM leads
WHERE email = 'iansorbie@regalprecisioneng.com'
AND NOT EXISTS (
  SELECT 1 FROM customers WHERE email = 'iansorbie@regalprecisioneng.com'
)
RETURNING id, first_name, last_name, owned_by;

-- Step 2: Update the lead to mark it as converted
-- Get the customer ID from Step 1 and use it here:
UPDATE leads
SET
  status = 'converted',
  converted_to_customer_id = (SELECT id FROM customers WHERE email = 'iansorbie@regalprecisioneng.com'),
  converted_at = NOW()
WHERE email = 'iansorbie@regalprecisioneng.com';

-- Step 3: Verify the conversion
SELECT
  'Customer' as record_type,
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  c.company,
  c.owned_by,
  u.first_name || ' ' || u.last_name as owner_name
FROM customers c
LEFT JOIN users u ON c.owned_by = u.id
WHERE c.email = 'iansorbie@regalprecisioneng.com'

UNION ALL

SELECT
  'Lead' as record_type,
  l.id,
  l.first_name,
  l.last_name,
  l.email,
  l.company,
  l.status::text as owned_by,
  l.converted_to_customer_id::text as owner_name
FROM leads l
WHERE l.email = 'iansorbie@regalprecisioneng.com';
