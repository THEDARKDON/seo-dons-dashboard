-- ============================================
-- QUICK FIX: Disable RLS for Development
-- Run this in Supabase SQL Editor
-- ============================================

-- OPTION 1: Completely disable RLS (for testing only)
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Enable RLS but allow all operations (more secure)
-- Uncomment below if you want RLS enabled but permissive

/*
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
DROP POLICY IF EXISTS "BDRs see own deals" ON deals;

CREATE POLICY "deals_allow_all" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "activities_allow_all" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "appointments_allow_all" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "commissions_allow_all" ON commissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "customers_allow_all" ON customers FOR ALL USING (true) WITH CHECK (true);
*/

-- ============================================
-- PRODUCTION SETUP (Do this later)
-- ============================================
-- For production, you need to:
-- 1. Set up Clerk JWT in Supabase
-- 2. Configure custom auth in Supabase
-- 3. Use the detailed RLS policies from supabase-rls-policies.sql
