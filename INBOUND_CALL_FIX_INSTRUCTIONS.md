# URGENT: Fix Inbound Call Routing for +447700158258

## Problem
When someone calls +447700158258, they hear: **"This number is not configured. Please contact support."**

Error in logs:
```
⚠️ No user found for number: +447700158258
```

## Root Cause
The phone number **+447700158258** is not assigned to any user in the database table `user_voip_settings`.

The webhook at [app/api/webhooks/twilio/voice/route.ts:32](app/api/webhooks/twilio/voice/route.ts#L32) tries to find a user for this number but fails, so it plays the error message at line 79.

## Fix (Run in Supabase SQL Editor)

### STEP 1: Check Current Assignments
```sql
-- See all phone number assignments
SELECT
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    vs.assigned_phone_number,
    vs.sms_enabled
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
ORDER BY u.email;
```

### STEP 2: Find Jamie's User ID
```sql
-- Find Jamie (or whoever should have this number)
SELECT
    id as user_id,
    clerk_id,
    first_name,
    last_name,
    email,
    role
FROM users
WHERE LOWER(first_name) LIKE '%jamie%'
   OR LOWER(last_name) LIKE '%jamie%'
   OR LOWER(email) LIKE '%jamie%';
```

**COPY THE USER ID FROM THIS QUERY**

### STEP 3: Assign the Number
Replace `'PASTE_USER_ID_HERE'` with the actual user ID from Step 2:

```sql
-- Assign +447700158258 to Jamie
INSERT INTO user_voip_settings (
    user_id,
    assigned_phone_number,
    caller_id_number,
    auto_record,
    auto_transcribe,
    voicemail_enabled,
    sms_enabled
)
VALUES (
    'PASTE_USER_ID_HERE',  -- ⚠️ CHANGE THIS TO JAMIE'S USER ID!
    '+447700158258',
    '+447700158258',
    true,
    true,
    true,
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    assigned_phone_number = '+447700158258',
    caller_id_number = '+447700158258',
    sms_enabled = true,
    updated_at = NOW();
```

### STEP 4: Verify the Fix
```sql
-- Confirm assignment worked
SELECT
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    vs.assigned_phone_number,
    'Inbound calls will now route to ' || u.first_name || ' ✅' as status
FROM users u
JOIN user_voip_settings vs ON u.id = vs.user_id
WHERE vs.assigned_phone_number = '+447700158258';
```

You should see Jamie's name and email with the phone number assigned.

## STEP 5: Test
1. Call **+447700158258** from your mobile phone
2. You should hear it ringing in Jamie's browser (not the error message)
3. Check Vercel logs - you should see:
   ```
   ✅ Routing inbound call to user: [Jamie's clerk_id]
   ```

## If Still Not Working

**Wait 30 seconds** for any caching to clear, then:

1. Check the assignment again with STEP 4 query
2. Verify the number in Twilio matches exactly: `+447700158258`
3. Check Vercel logs for any new errors
4. Verify Jamie is logged into the dashboard

## Alternative: Quick Fix with Email

If you know Jamie's email address, use this single query:

```sql
INSERT INTO user_voip_settings (
    user_id,
    assigned_phone_number,
    caller_id_number,
    auto_record,
    auto_transcribe,
    voicemail_enabled,
    sms_enabled
)
SELECT
    id,
    '+447700158258',
    '+447700158258',
    true,
    true,
    true,
    true
FROM users
WHERE email = 'jamie@example.com'  -- ⚠️ CHANGE THIS TO JAMIE'S ACTUAL EMAIL!
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
    assigned_phone_number = '+447700158258',
    caller_id_number = '+447700158258',
    sms_enabled = true,
    updated_at = NOW();
```

## Expected Result
- ✅ Inbound calls to +447700158258 will route to Jamie's browser
- ✅ Jamie will see incoming call notification
- ✅ Call will be recorded and transcribed automatically
- ✅ No more "This number is not configured" error

---

**Created:** 2025-10-31
**Status:** Ready to execute
**Action Required:** Run queries in Supabase SQL Editor
