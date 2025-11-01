# Why Calendar Integration Broke - Root Cause Analysis

## The Problem

Calendar worked before, but now shows as "not connected" even after OAuth flow completes.

## What Happened

### Timeline of Changes:

1. **BEFORE (Working):**
   - Table: `user_calendar_integrations`
   - Migration: `016_calendar_integration.sql`
   - Code queried: `user_calendar_integrations`
   - Status: ✅ WORKING

2. **CHANGE MADE (Migration 028):**
   - New table created: `user_integrations`
   - Purpose: Unify Gmail AND Calendar integrations in one table
   - Code updated to query: `user_integrations`
   - Old table: Still exists in production

3. **NOW (Broken):**
   - Production database: Has `user_calendar_integrations` with data
   - Code queries: `user_integrations` (EMPTY!)
   - Result: Calendar shows as "not connected"

## The Mismatch

### Production Database Has:
```
user_calendar_integrations (old table)
├── access_token
├── refresh_token
├── email
├── calendar_id
└── is_active

user_integrations (new table - EMPTY or doesn't exist!)
```

### Code Expects:
```typescript
// lib/calendar/google-calendar.ts line 288-293
const { data } = await supabase
  .from('user_integrations')  // ← Looking for NEW table
  .select('id')
  .eq('user_id', userId)
  .eq('provider', 'google')
  .maybeSingle();
```

### What Actually Happens:
1. OAuth completes successfully
2. Code saves to `user_integrations`
3. But production may not have this table yet!
4. `isConnected()` queries `user_integrations`
5. Finds nothing
6. Returns false

## The Fix

You have 2 options:

### Option 1: Run Migration to Create & Migrate Data (RECOMMENDED)

Run [REVERT_CALENDAR_TO_WORKING_STATE.sql](REVERT_CALENDAR_TO_WORKING_STATE.sql) which:
1. Creates `user_integrations` table
2. Migrates existing calendar connections from old table
3. Keeps both tables synchronized
4. Also fixes daily tasks constraint

### Option 2: Revert Code to Use Old Table

Change code back to query `user_calendar_integrations`:

**File:** `lib/calendar/google-calendar.ts`

```typescript
// Change line 289:
.from('user_integrations')
// Back to:
.from('user_calendar_integrations')

// And line 156:
.from('user_integrations')
// Back to:
.from('user_calendar_integrations')
```

## Why This Matters

The unification was a GOOD idea (one table for all OAuth):
- ✅ Gmail integration
- ✅ Google Calendar
- ✅ Future: Outlook, etc.

BUT the migration wasn't fully applied to production:
- ❌ New table not created
- ❌ Or created but data not migrated
- ❌ Old connections still in old table

## Verification After Fix

Run this to check:

```sql
-- Should show connections in BOTH tables
SELECT 'OLD' as source, user_id, email, created_at
FROM user_calendar_integrations
UNION ALL
SELECT 'NEW' as source, user_id::text,
       metadata->>'email', created_at
FROM user_integrations
WHERE provider = 'google';
```

Expected: Rows in both, or all migrated to NEW.

## Related Issues Fixed

The same SQL also fixes:
1. **Daily tasks constraint** - Added `linkedin_post` to allowed types
2. **Contact fields** - Already added `contact_email` in previous fix

## Test After Fix

1. Run SQL from `REVERT_CALENDAR_TO_WORKING_STATE.sql`
2. Check if existing connections show up: `SELECT * FROM user_integrations WHERE provider = 'google';`
3. If no data, try connecting calendar again
4. Check button now shows "Disconnect" with checkmark
5. Try creating appointment - should sync to calendar

## Why SQL Had Syntax Errors Before

Previous SQL files had missing semicolons and incomplete statements:

**Wrong:**
```sql
ALTER TABLE daily_tasks ADD CONSTRAINT daily_tasks_task_type_check
CHECK (task_type IN ('calls', 'appointments'...
```
Missing closing parenthesis and semicolon!

**Fixed:**
```sql
ALTER TABLE daily_tasks
DROP CONSTRAINT IF EXISTS daily_tasks_task_type_check;

ALTER TABLE daily_tasks
ADD CONSTRAINT daily_tasks_task_type_check
CHECK (task_type IN (
    'calls',
    'appointments',
    'linkedin',
    'linkedin_post',
    'linkedin_share',
    'prospecting',
    'research'
));
```

## Summary

**Root Cause:** Code updated to use `user_integrations`, but production database still has/needs the old `user_calendar_integrations` table, or the new table exists but data wasn't migrated.

**Solution:** Run `REVERT_CALENDAR_TO_WORKING_STATE.sql` which creates new table, migrates data, and fixes daily tasks.

**Files to Use:**
- ✅ [REVERT_CALENDAR_TO_WORKING_STATE.sql](REVERT_CALENDAR_TO_WORKING_STATE.sql) - Complete fix
- ❌ FIX_CALENDAR_AND_DAILY_TASKS.sql - Had syntax errors
- ❌ FIX_CALENDAR_AND_EMAIL.sql - Only partial fix

---

**Status:** Ready to apply - Run REVERT_CALENDAR_TO_WORKING_STATE.sql
**Priority:** HIGH - Blocking calendar functionality
**Impact:** Restores working calendar integration + fixes daily tasks
