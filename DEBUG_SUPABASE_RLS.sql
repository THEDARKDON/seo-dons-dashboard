-- DEBUG: Supabase RLS Policies
-- Run this in Supabase SQL Editor to check if RLS is blocking user lookups

-- ============================================
-- STEP 1: Check if users table RLS is enabled
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';
-- If rowsecurity = true, RLS is enabled

-- ============================================
-- STEP 2: Check all RLS policies on users table
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- ============================================
-- STEP 3: Test if you can query users table
-- ============================================
-- This should return all users
SELECT
  id,
  clerk_id,
  email,
  first_name,
  last_name,
  role,
  active
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- If this returns empty or error, RLS is blocking!

-- ============================================
-- STEP 4: Check if anon key can read users
-- ============================================
-- The anon key (used by the app) needs SELECT permission
SELECT COUNT(*) as total_users FROM users;

-- If this returns 0 or error, anon key is blocked!

-- ============================================
-- QUICK FIX: Disable RLS temporarily (TESTING ONLY!)
-- ============================================
/*
-- ⚠️ WARNING: Only for testing! Re-enable after!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test your app now
-- If it works, RLS was the problem

-- Re-enable RLS after testing:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
*/

-- ============================================
-- PERMANENT FIX: Add policy for anon role
-- ============================================
-- If RLS is blocking, add this policy:

/*
-- Allow anon and authenticated roles to read users by clerk_id
CREATE POLICY "Allow user lookup by clerk_id"
ON users
FOR SELECT
TO anon, authenticated
USING (true);  -- Allow all reads

-- Or more restrictive (recommended):
CREATE POLICY "Allow user lookup by clerk_id"
ON users
FOR SELECT
TO anon, authenticated
USING (
  clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR role = 'admin'
);
*/

-- ============================================
-- STEP 5: Check if service_role works
-- ============================================
-- The webhook uses service_role which should bypass RLS
-- But if service_role key is wrong, it won't work

-- To test: Try this query in Supabase (uses service_role automatically)
SELECT 'Service role works!' as status;

-- If this fails, service role key might be corrupted
