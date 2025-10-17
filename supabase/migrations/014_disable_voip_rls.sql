-- Disable RLS on user_voip_settings table
-- We use Clerk for authentication, not Supabase Auth
-- The auth.uid() in RLS policies always returns null, blocking all queries
-- Routes are already protected by Clerk middleware

ALTER TABLE user_voip_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue DISABLE ROW LEVEL SECURITY;

-- Drop the Supabase Auth-based policies since they don't work with Clerk
DROP POLICY IF EXISTS "Users can view own VoIP settings" ON user_voip_settings;
DROP POLICY IF EXISTS "Admins can manage all VoIP settings" ON user_voip_settings;
DROP POLICY IF EXISTS "Users can view own call recordings" ON call_recordings;
DROP POLICY IF EXISTS "Admins can view all call recordings" ON call_recordings;
DROP POLICY IF EXISTS "Users can insert own call recordings" ON call_recordings;
DROP POLICY IF EXISTS "Users can view own call queue" ON call_queue;
DROP POLICY IF EXISTS "Users can manage own call queue" ON call_queue;
