-- Fix users table role constraint to include all valid roles
-- Error: role 'sdr' was failing constraint check

-- Drop existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with all valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'bdr', 'sdr'));

-- Verify current roles in use
DO $$
BEGIN
  RAISE NOTICE 'Current roles in users table:';
  PERFORM DISTINCT role FROM users;
END $$;
