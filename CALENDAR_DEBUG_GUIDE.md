# Calendar Integration Debug Guide

## Issue: Calendar Shows as Not Connected

You ran the SQL to add `contact_name` and `contact_email` columns successfully, and manual appointments now work. However, Google Calendar integration still shows as not connected.

## Step 1: Run SQL to Fix Daily Tasks

First, fix the LinkedIn daily tasks error:

**Run in Supabase:** https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new

```sql
-- Fix daily tasks constraint
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

## Step 2: Debug Calendar Connection

### Check if user_integrations table exists and has correct structure:

```sql
-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_integrations'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- user_id (uuid)
- provider (text)
- provider_user_id (text)
- access_token (text)
- refresh_token (text)
- token_expiry (timestamptz)
- scopes (text[])
- metadata (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)

### Check if there are ANY calendar integrations:

```sql
SELECT
    ui.id,
    ui.user_id,
    ui.provider,
    ui.created_at,
    u.first_name,
    u.last_name,
    u.email
FROM user_integrations ui
JOIN users u ON ui.user_id = u.id
WHERE ui.provider = 'google'
ORDER BY ui.created_at DESC;
```

**If NO results:** Calendar was never actually connected.

**If there ARE results:** The `isConnected` check might be failing.

## Step 3: Try Connecting Calendar Again

1. Go to `/dashboard/settings`
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Watch browser console for errors
5. Check Vercel logs for server-side errors

### What to look for in logs:

**Success flow:**
```
[calendar/callback] Received OAuth callback
[GoogleCalendar] handleCallback - userId: xxx
[GoogleCalendar] Exchanging code for tokens...
[GoogleCalendar] Got tokens, access_token: true, refresh_token: true
[GoogleCalendar] Getting user info from Google...
[GoogleCalendar] Got user email: xxx@gmail.com
[GoogleCalendar] Saving to database...
[GoogleCalendar] Successfully saved integration
```

**Failure indicators:**
- "Failed to get tokens from Google" - OAuth config issue
- "Failed to get user email from Google" - Scope issue
- "Database error" - Check the actual error message

## Step 4: Check Environment Variables

Verify these are set in Vercel:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://www.seodonscrm.co.uk/api/calendar/callback
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Test OAuth redirect URI:

The redirect URI in Vercel MUST match exactly what's in Google Cloud Console:
- Google Console: https://console.cloud.google.com/apis/credentials
- Should be: `https://www.seodonscrm.co.uk/api/calendar/callback`

## Step 5: Check RLS Policies

The `user_integrations` table has RLS enabled. Verify the service role key can bypass it:

```sql
-- Check RLS status
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_integrations';

-- Check policies
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_integrations';
```

## Step 6: Manual Test

Try manually inserting a test integration to verify database permissions:

```sql
DO $$
DECLARE
    test_user_id UUID;
    test_integration_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO test_user_id
    FROM users
    WHERE email = 'your-email@example.com';  -- Replace with your email

    IF test_user_id IS NOT NULL THEN
        -- Insert test integration
        INSERT INTO user_integrations (
            user_id,
            provider,
            provider_user_id,
            access_token,
            refresh_token,
            token_expiry,
            scopes,
            metadata
        ) VALUES (
            test_user_id,
            'google',
            'test-google-id',
            'test-access-token',
            'test-refresh-token',
            NOW() + INTERVAL '1 hour',
            ARRAY['calendar', 'email'],
            '{"email": "test@gmail.com"}'::jsonb
        )
        ON CONFLICT (user_id, provider) DO UPDATE
        SET access_token = EXCLUDED.access_token
        RETURNING id INTO test_integration_id;

        RAISE NOTICE 'Test successful! Integration ID: %', test_integration_id;

        -- Now check if isConnected query works
        PERFORM * FROM user_integrations
        WHERE user_id = test_user_id
        AND provider = 'google';

        IF FOUND THEN
            RAISE NOTICE 'Query test successful!';
        ELSE
            RAISE WARNING 'Query test failed!';
        END IF;

        -- Clean up
        DELETE FROM user_integrations WHERE id = test_integration_id;
        RAISE NOTICE 'Test cleaned up';
    ELSE
        RAISE NOTICE 'User not found';
    END IF;
END $$;
```

## Common Issues & Solutions

### Issue 1: "Missing code or state" in callback

**Cause:** OAuth flow interrupted or wrong redirect URI

**Fix:**
1. Check GOOGLE_REDIRECT_URI in Vercel matches Google Console exactly
2. Ensure no trailing slashes
3. Must be HTTPS in production

### Issue 2: "Failed to get refresh token"

**Cause:** OAuth not requesting offline access or user already authorized

**Fix:**
1. Code already includes `access_type: 'offline'` and `prompt: 'consent'`
2. Revoke access at https://myaccount.google.com/permissions
3. Try connecting again

### Issue 3: Calendar shows as connected in logs but UI says not connected

**Cause:** `isConnected` query might be checking wrong field

**Fix:** Check the actual query in `lib/calendar/google-calendar.ts`:

```typescript
// Should be:
.select('id')
.eq('user_id', userId)
.eq('provider', 'google')
.maybeSingle();
```

### Issue 4: RLS blocking the insert

**Cause:** Service role key not configured correctly

**Fix:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel
2. Check it's the SERVICE ROLE key, not anon key
3. Service role key should start with `eyJ...` and be very long

### Issue 5: Column `provider_account_id` does not exist

**Cause:** Code trying to use old column name

**Fix:** Already fixed - code uses `provider_user_id`

## Testing Checklist

After fixes:

- [ ] Run daily tasks SQL fix
- [ ] Verify `user_integrations` table exists with correct columns
- [ ] Check environment variables in Vercel
- [ ] Verify Google OAuth redirect URI matches
- [ ] Try connecting calendar from `/dashboard/settings`
- [ ] Check Vercel logs for errors during OAuth flow
- [ ] Verify integration saved in database
- [ ] Confirm "Connect Google Calendar" button changes to "Disconnect"
- [ ] Try creating an appointment with calendar integration

## Expected Behavior After Fix

1. Click "Connect Google Calendar"
2. Redirected to Google OAuth consent screen
3. Grant permissions
4. Redirected back to `/dashboard/settings?calendar_connected=true`
5. Button now shows "Disconnect Google Calendar" with checkmark
6. Can create appointments that sync to Google Calendar
7. Calendar invites sent to leads/customers

## Logs to Monitor

**Browser Console:**
- Watch for API errors during OAuth flow
- Check for redirect issues

**Vercel Logs:**
- Filter for `[calendar/callback]` and `[GoogleCalendar]`
- Look for database errors
- Check token exchange success

**Supabase Logs:**
- Go to: https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/logs/explorer
- Filter table: `user_integrations`
- Check for INSERT/UPDATE operations

---

## Quick Fix Summary

1. **Run SQL from FIX_CALENDAR_AND_DAILY_TASKS.sql**
2. **Check if ANY calendar integrations exist in database**
3. **If none exist:** Try connecting again and watch logs
4. **If exist but shows disconnected:** Debug the `isConnected` query
5. **Check environment variables** especially SERVICE_ROLE_KEY

---

**Priority:** HIGH - Blocking calendar features
**Status:** Awaiting SQL execution and reconnection test
