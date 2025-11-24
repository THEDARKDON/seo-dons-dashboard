-- Migration: Add ownership to customers table
-- This makes customers SDR-specific while allowing managers/admins to see all

-- Add created_by and owned_by columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS owned_by UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_owned_by ON customers(owned_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);

-- Update existing customers to be owned by the first admin/manager
-- (You can manually reassign these later if needed)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM users WHERE role IN ('admin', 'manager') ORDER BY created_at LIMIT 1;

    IF first_user_id IS NOT NULL THEN
        UPDATE customers
        SET owned_by = first_user_id,
            created_by = first_user_id
        WHERE owned_by IS NULL;
    END IF;
END $$;

-- Update RLS policies for customers table
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- SELECT: BDRs see only their customers, managers/admins see all
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = customers.owned_by
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- INSERT: Users can create customers (owned by them)
CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.id = customers.owned_by
        )
    );

-- UPDATE: BDRs can update their own customers, managers/admins can update all
CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND (
                users.id = customers.owned_by
                OR users.role IN ('manager', 'admin')
            )
        )
    );

-- DELETE: Only admins can delete customers
CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role IN ('admin')
        )
    );

-- Add comment
COMMENT ON COLUMN customers.owned_by IS 'The SDR/BDR who owns this customer';
COMMENT ON COLUMN customers.created_by IS 'The user who created this customer record';
