# Run Migration 031 - Calendar & Daily Tasks Fix

## Location

**File:** `supabase/migrations/031_fix_calendar_and_daily_tasks.sql`

## What It Fixes

1. ✅ Creates `user_integrations` table (unified OAuth storage)
2. ✅ Migrates existing calendar connections from old table
3. ✅ Fixes daily tasks constraint (adds `linkedin_post`, `linkedin_share`)
4. ✅ Updates task points calculation
5. ✅ Adds proper RLS security policies

## How to Run

### Option 1: Direct SQL (Recommended)

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new

2. Open local file:
   `supabase/migrations/031_fix_calendar_and_daily_tasks.sql`

3. Copy ALL content

4. Paste into SQL Editor

5. Click "Run"

### Option 2: Via Git

```bash
# File is already in your repo
cat supabase/migrations/031_fix_calendar_and_daily_tasks.sql
```

Then copy and run in Supabase.

## Expected Output

After running, you should see:

```
NOTICE: Migrated calendar integrations from user_calendar_integrations to user_integrations
```

## Verification

Run these queries to verify:

```sql
-- Check user_integrations was created
SELECT COUNT(*) FROM user_integrations WHERE provider = 'google';

-- Check daily_tasks constraint
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'daily_tasks_task_type_check';
```

**Expected:**
- Row count matching your calendar connections
- Constraint includes: `linkedin_post`, `linkedin_share`

## After Migration

1. ✅ Calendar connections will work again
2. ✅ Daily tasks for LinkedIn posts will work
3. ✅ Manual appointments already working (from previous fix)
4. ✅ Email settings working

## Troubleshooting

### If Calendar Still Shows "Not Connected"

After migration, try:
1. Go to `/dashboard/settings`
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Should now save to correct table

### If Daily Tasks Still Fail

Check the constraint was updated:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'daily_tasks'::regclass;
```

Should include all 7 task types.

## Files Summary

- ✅ **Migration 031** - `supabase/migrations/031_fix_calendar_and_daily_tasks.sql` (USE THIS)
- ❌ FINAL_WORKING_FIX.sql - Reference only
- ❌ REVERT_CALENDAR_TO_WORKING_STATE.sql - Reference only
- ❌ FIX_CALENDAR_AND_DAILY_TASKS.sql - Had syntax errors

**Always use the properly numbered migration in the `supabase/migrations/` folder!**

---

**Status:** Ready to run
**Priority:** HIGH
**Impact:** Fixes calendar + daily tasks
