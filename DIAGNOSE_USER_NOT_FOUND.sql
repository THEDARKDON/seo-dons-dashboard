-- DIAGNOSTIC SQL: User Not Found Issue
-- Run this in your Supabase SQL Editor to diagnose the problem

-- 1. Check all users in database
SELECT
  id,
  clerk_id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM users
ORDER BY created_at DESC;

-- 2. Count total users
SELECT COUNT(*) as total_users FROM users;

-- 3. Check for any NULL clerk_ids
SELECT
  id,
  email,
  clerk_id,
  role
FROM users
WHERE clerk_id IS NULL;

-- 4. Check if users table exists and has correct structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check recent user activity (if any)
SELECT
  clerk_id,
  email,
  created_at,
  updated_at
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================
-- TEMPORARY FIX: Manually add missing users
-- ============================================
-- If users are missing, you need to add them manually
-- Get the Clerk User IDs from Clerk Dashboard, then run:

/*
-- EXAMPLE: Add a user (replace with actual values)
INSERT INTO users (clerk_id, email, first_name, last_name, role)
VALUES (
  'user_XXXXXXXXXXXXXXXXXX',  -- Get this from Clerk Dashboard
  'user@example.com',
  'First',
  'Last',
  'admin'  -- or 'manager' or 'bdr'
)
ON CONFLICT (clerk_id) DO NOTHING;
*/

-- ============================================
-- PERMANENT FIX: Verify Clerk webhook is set up
-- ============================================
-- The webhook should automatically create users when they sign up
-- Check if webhook is configured at:
-- https://dashboard.clerk.com/apps/[your-app]/webhooks
