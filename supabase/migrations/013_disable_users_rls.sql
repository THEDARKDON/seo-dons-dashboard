-- Disable RLS on users table
-- We use Clerk for authentication, not Supabase Auth
-- Routes are already protected by Clerk middleware
-- The users table is only for storing user profile data linked to Clerk IDs

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on users table
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
