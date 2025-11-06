-- Fix Ian Sorbie's incomplete conversion
-- Lead is marked 'converted' but no customer exists

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
  owned_by,
  created_at,
  updated_at
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
  assigned_to as owned_by,
  NOW() as created_at,
  NOW() as updated_at
FROM leads
WHERE id = '6d9bdf9f-a848-41a2-ab93-0ea6af50cdad'
RETURNING id as customer_id, first_name, last_name, company, owned_by;

-- Step 2: Update the lead with the customer ID
UPDATE leads
SET
  converted_to_customer_id = (
    SELECT id FROM customers WHERE email = 'iansorbie@regalprecisioneng.com' LIMIT 1
  ),
  converted_at = NOW()
WHERE id = '6d9bdf9f-a848-41a2-ab93-0ea6af50cdad';

-- Step 3: Verify it worked
SELECT
  'SUCCESS!' as status,
  c.id as customer_id,
  c.first_name || ' ' || c.last_name as name,
  c.company,
  c.email,
  u.first_name || ' ' || u.last_name as owner,
  l.converted_to_customer_id,
  l.converted_at
FROM customers c
LEFT JOIN users u ON c.owned_by = u.id
LEFT JOIN leads l ON l.converted_to_customer_id = c.id
WHERE c.email = 'iansorbie@regalprecisioneng.com';
