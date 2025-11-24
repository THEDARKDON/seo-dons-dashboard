-- SUPABASE CORS QUICK FIX
-- This fixes the RLS side of CORS issues

-- ============================================
-- ISSUE: Client-side requests blocked by RLS
-- ============================================
-- Browser shows CORS error when trying to fetch from Supabase
-- because RLS policies don't allow anon role to read users

-- ============================================
-- STEP 1: Check current RLS status
-- ============================================
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- ============================================
-- STEP 2: Check existing policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- ============================================
-- STEP 3: Add policy to allow client-side reads
-- ============================================
-- This allows the browser (using anon key) to read users
-- ⚠️ Adjust the USING clause for your security needs

-- Option A: Allow all users to read all users (least restrictive)
DROP POLICY IF EXISTS "Allow authenticated user lookup" ON users;
CREATE POLICY "Allow authenticated user lookup"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- Option B: Only allow users to read their own data (more secure)
-- Uncomment this instead if you want stricter security:
/*
DROP POLICY IF EXISTS "Allow users to read own data" ON users;
CREATE POLICY "Allow users to read own data"
ON users
FOR SELECT
TO anon, authenticated
USING (
  clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
*/

-- ============================================
-- STEP 4: Verify policy was created
-- ============================================
SELECT
  policyname,
  roles,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'users'
AND policyname = 'Allow authenticated user lookup';

-- Should return 1 row showing the policy

-- ============================================
-- STEP 5: Test that anon can now read
-- ============================================
-- This simulates what the browser does
SET ROLE anon;
SELECT COUNT(*) as can_read_users FROM users;
RESET ROLE;

-- If this returns a count > 0, the policy works!
-- If it returns 0 or error, RLS is still blocking

-- ============================================
-- STEP 6: If still not working, temporarily disable RLS
-- ============================================
-- ⚠️ WARNING: Only for testing! Re-enable immediately after!
-- Uncomment to test:
/*
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test your app now
-- If it works, RLS was the issue

-- Re-enable RLS:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Then add proper policies above
*/

-- ============================================
-- IMPORTANT: Also check Supabase Auth Settings
-- ============================================
-- This SQL fixes RLS, but you ALSO need to:
-- 1. Go to: https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/auth/url-configuration
-- 2. Add your domain to "Site URL" and "Redirect URLs"
-- 3. Save changes
-- 4. Wait 30 seconds
-- 5. Clear browser cache
-- 6. Test again

-- Both RLS policies AND domain configuration must be correct!
