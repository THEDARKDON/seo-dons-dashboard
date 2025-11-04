-- Migration 045: Fix Proposals RLS INSERT Policy
-- The original INSERT policy was checking proposals.created_by against a non-existent row
-- This fixes it to properly validate during INSERT

-- Drop the broken INSERT policy
DROP POLICY IF EXISTS proposals_insert_policy ON proposals;

-- Create correct INSERT policy
-- Users can insert proposals if they are authenticated and setting created_by to their own user ID
CREATE POLICY proposals_insert_policy ON proposals
  FOR INSERT
  WITH CHECK (
    created_by IN (
      SELECT id FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 045: Fixed proposals INSERT RLS policy';
END $$;
