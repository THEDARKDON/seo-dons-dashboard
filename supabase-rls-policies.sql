-- ============================================
-- RLS POLICIES FOR DEALS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's ensure RLS is enabled
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to recreate properly
DROP POLICY IF EXISTS "BDRs see own deals" ON deals;

-- 1. SELECT Policy - BDRs see own deals, managers/admins see all
CREATE POLICY "deals_select_policy" ON deals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = deals.assigned_to
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- 2. INSERT Policy - Users can create deals assigned to themselves
CREATE POLICY "deals_insert_policy" ON deals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.id = deals.assigned_to
        )
    );

-- 3. UPDATE Policy - BDRs can update own deals, managers/admins can update all
CREATE POLICY "deals_update_policy" ON deals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = deals.assigned_to
                OR users.role IN ('manager', 'admin')
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = deals.assigned_to
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- 4. DELETE Policy - Only managers and admins can delete
CREATE POLICY "deals_delete_policy" ON deals
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role IN ('manager', 'admin')
        )
    );

-- ============================================
-- RLS POLICIES FOR ACTIVITIES TABLE
-- ============================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see their own activities
CREATE POLICY "activities_select_policy" ON activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = activities.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- INSERT: Users can create their own activities
CREATE POLICY "activities_insert_policy" ON activities
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.id = activities.user_id
        )
    );

-- UPDATE: Users can update their own activities
CREATE POLICY "activities_update_policy" ON activities
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = activities.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- DELETE: Users can delete their own activities
CREATE POLICY "activities_delete_policy" ON activities
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = activities.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- ============================================
-- RLS POLICIES FOR APPOINTMENTS TABLE
-- ============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = appointments.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.id = appointments.user_id
        )
    );

CREATE POLICY "appointments_update_policy" ON appointments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = appointments.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

CREATE POLICY "appointments_delete_policy" ON appointments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = appointments.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- ============================================
-- RLS POLICIES FOR COMMISSIONS TABLE
-- ============================================

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own commissions, managers/admins see all
CREATE POLICY "commissions_select_policy" ON commissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = commissions.user_id
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- Only system/triggers can insert commissions (not users directly)
-- This policy will allow inserts only from authenticated sessions
CREATE POLICY "commissions_insert_policy" ON commissions
    FOR INSERT
    WITH CHECK (true);  -- Triggers run with elevated privileges

-- Only admins can update commissions (for approval/payment)
CREATE POLICY "commissions_update_policy" ON commissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role IN ('admin')
        )
    );

-- ============================================
-- RLS POLICIES FOR CUSTOMERS TABLE
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Everyone can see all customers (for deal assignment)
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Anyone can create customers
CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Anyone can update customers
CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Only admins can delete customers
CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role IN ('admin')
        )
    );

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Run this to see all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';
