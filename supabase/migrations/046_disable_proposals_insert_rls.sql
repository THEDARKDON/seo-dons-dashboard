-- Migration 046: Disable RLS for proposals table
-- The API already validates authentication via Clerk before any operations
-- This allows the API to perform all operations while maintaining security at the API layer

-- Disable RLS entirely for proposals table
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;

-- Note: Security is enforced by:
-- 1. Clerk authentication validates all API requests
-- 2. API ensures created_by is set to authenticated user
-- 3. API validates user permissions before operations

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 046: Disabled RLS for proposals table';
  RAISE NOTICE 'Security is enforced by Clerk authentication in the API layer';
END $$;
