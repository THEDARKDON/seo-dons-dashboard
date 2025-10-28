# Diagnostic: Calls Showing 0 Everywhere

## Issue
Calls show as 0 across the dashboard even though call recordings exist in the database.

## Code Analysis

### Dashboard Query (app/dashboard/page.tsx:55-59)
```typescript
const { count: callsTodayCount } = await supabase
  .from('call_recordings')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', todayStart.toISOString());
```

This query is correct and should work.

## Possible Causes

### 1. Migration 020 Not Applied
The analytics page queries the `activities` table, which needs Migration 020 to sync data from `call_recordings`.

**Fix**: Apply Migration 020 in Supabase SQL Editor

### 2. User ID Mismatch
The query filters by `user_id` but:
- `call_recordings.user_id` might be NULL
- `call_recordings.user_id` might not match the logged-in user's Supabase ID

**Diagnostic Query**:
```sql
-- Check if call_recordings have user_id
SELECT
    COUNT(*) as total_calls,
    COUNT(user_id) as calls_with_user_id,
    COUNT(*) - COUNT(user_id) as calls_without_user_id
FROM call_recordings;

-- Check user_id values
SELECT DISTINCT user_id
FROM call_recordings
WHERE user_id IS NOT NULL
LIMIT 10;

-- Check current user's ID
SELECT id, clerk_id, first_name, last_name
FROM users
WHERE clerk_id = 'YOUR_CLERK_ID'; -- Replace with actual Clerk ID
```

### 3. Timestamp Issue
The `todayStart` might be in wrong timezone or format.

**Diagnostic Query**:
```sql
-- Check call timestamps
SELECT
    call_sid,
    created_at,
    created_at AT TIME ZONE 'UTC' as created_at_utc,
    NOW() as current_time,
    AGE(NOW(), created_at) as age
FROM call_recordings
ORDER BY created_at DESC
LIMIT 10;
```

### 4. RLS (Row Level Security) Blocking Access
Even though RLS is disabled on call_recordings (migration 014), it might have been re-enabled.

**Diagnostic Query**:
```sql
-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'call_recordings';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'call_recordings';
```

## Quick Test Queries

Run these in Supabase SQL Editor to diagnose:

```sql
-- 1. Total calls in database
SELECT COUNT(*) as total_calls FROM call_recordings;

-- 2. Calls per user
SELECT
    u.first_name,
    u.last_name,
    COUNT(cr.id) as call_count
FROM users u
LEFT JOIN call_recordings cr ON cr.user_id = u.id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY call_count DESC;

-- 3. Calls today (all users)
SELECT COUNT(*) as calls_today
FROM call_recordings
WHERE created_at >= CURRENT_DATE;

-- 4. Recent calls with user info
SELECT
    cr.call_sid,
    cr.created_at,
    cr.status,
    cr.duration_seconds,
    u.first_name,
    u.last_name
FROM call_recordings cr
LEFT JOIN users u ON cr.user_id = u.id
ORDER BY cr.created_at DESC
LIMIT 10;
```

## Expected Results

If calls exist:
- Query 1 should return > 0
- Query 2 should show users with call counts
- Query 3 should show today's calls
- Query 4 should show recent calls with user names

If any query returns 0 or NULL for user_id, that's the problem.

## Most Likely Fix

Based on the webhook code at `app/api/webhooks/twilio/status/route.ts`, the `user_id` should be set when calls are created.

If `user_id` is NULL, the webhook might not be finding the user properly. Check:
1. Is the phone number assigned to a user in `user_voip_settings`?
2. Is the webhook receiving the correct phone number?
3. Is the user lookup working correctly?

## Next Steps

1. Run diagnostic queries above
2. Apply Migration 020 (for analytics sync)
3. Check if call recordings have `user_id` populated
4. If user_id is NULL, check webhook logs
5. Test making a new call and verify it gets a user_id
