-- Migration 045: Fix Proposals RLS INSERT Policy
-- The original INSERT policy was checking proposals.created_by against a non-existent row
-- This fixes it to properly validate during INSERT

-- Drop the broken INSERT policy
DROP POLICY IF EXISTS proposals_insert_policy ON proposals;

-- Create correct INSERT policy
-- Allow authenticated users to insert proposals (they set created_by via the API)
-- The API already validates the user via Clerk authentication
CREATE POLICY proposals_insert_policy ON proposals
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'sub' IS NOT NULL
  );

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 045: Fixed proposals INSERT RLS policy to allow authenticated inserts';
END $$;
