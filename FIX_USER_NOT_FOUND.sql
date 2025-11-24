-- FIX: User Not Found Issue
-- This happens when Clerk authentication succeeds but Supabase can't find the user
-- Root cause: clerk_id mismatch or missing users in Supabase

-- ============================================
-- STEP 1: Check current users and their clerk_ids
-- ============================================
SELECT
  id,
  clerk_id,
  email,
  first_name,
  last_name,
  role,
  active,
  created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: Check for problematic clerk_ids
-- ============================================
-- NULL clerk_ids
SELECT COUNT(*) as users_with_null_clerk_id
FROM users
WHERE clerk_id IS NULL;

-- Duplicate clerk_ids (shouldn't happen but check anyway)
SELECT clerk_id, COUNT(*) as count
FROM users
WHERE clerk_id IS NOT NULL
GROUP BY clerk_id
HAVING COUNT(*) > 1;

-- ============================================
-- STEP 3: Find users without proper clerk_ids
-- ============================================
-- If you see users with NULL or incorrect clerk_ids, you need to update them
-- Get the correct Clerk IDs from: https://dashboard.clerk.com/apps/your-app/users

SELECT
  id,
  email,
  clerk_id,
  first_name,
  last_name
FROM users
WHERE clerk_id IS NULL
   OR clerk_id = ''
   OR LENGTH(clerk_id) < 10;

-- ============================================
-- STEP 4: Update clerk_id for existing users
-- ============================================
-- Get the correct Clerk User ID from Clerk Dashboard
-- Then update each user:

/*
-- EXAMPLE: Update a user's clerk_id
UPDATE users
SET clerk_id = 'user_2xxxxxxxxxxxxxxxxxxxxx'  -- Get from Clerk Dashboard
WHERE email = 'user@example.com';

-- Verify the update
SELECT id, clerk_id, email, first_name, last_name
FROM users
WHERE email = 'user@example.com';
*/

-- ============================================
-- STEP 5: Add missing users
-- ============================================
-- If a user exists in Clerk but NOT in Supabase, add them:

/*
-- Get the Clerk User ID from: https://dashboard.clerk.com/apps/your-app/users
-- Then insert the user:

INSERT INTO users (clerk_id, email, first_name, last_name, role, active)
VALUES (
  'user_2xxxxxxxxxxxxxxxxxxxxx',  -- From Clerk Dashboard
  'newuser@example.com',
  'First',
  'Last',
  'bdr',  -- or 'manager' or 'admin'
  true
)
ON CONFLICT (clerk_id) DO NOTHING;
*/

-- ============================================
-- QUICK FIX: Get Clerk IDs from Clerk Dashboard
-- ============================================
/*
1. Go to: https://dashboard.clerk.com/apps/your-app/users
2. For EACH user that's getting "User not found" error:
   a. Click on the user
   b. Copy their User ID (starts with "user_")
   c. Run this update:

UPDATE users
SET clerk_id = 'user_PASTE_ID_HERE'
WHERE email = 'their@email.com';

3. Verify:
SELECT clerk_id, email, first_name, last_name, role
FROM users
WHERE email = 'their@email.com';

4. User should now be able to log in!
*/

-- ============================================
-- STEP 6: Verify the fix
-- ============================================
-- After updating clerk_ids, verify all active users have valid clerk_ids:
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN clerk_id IS NOT NULL AND LENGTH(clerk_id) > 10 THEN 1 END) as users_with_valid_clerk_id,
  COUNT(CASE WHEN clerk_id IS NULL OR LENGTH(clerk_id) <= 10 THEN 1 END) as users_with_invalid_clerk_id
FROM users
WHERE active = true;

-- ============================================
-- PREVENTION: Ensure webhook is configured
-- ============================================
/*
To prevent this in the future, configure Clerk webhook:

1. Go to: https://dashboard.clerk.com/apps/your-app/webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: https://your-domain.vercel.app/api/webhook/clerk
4. Subscribe to these events:
   - user.created
   - user.updated
   - user.deleted
5. Copy the "Signing Secret"
6. Add to Vercel environment variables:
   - Name: CLERK_WEBHOOK_SECRET
   - Value: whsec_xxxxxxxxxxxxxxxxxxxxx
7. Redeploy your app

Now new users will automatically be synced to Supabase!
*/
