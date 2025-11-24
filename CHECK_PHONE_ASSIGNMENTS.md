# Phone Number Assignment Debugging Guide

## Problem
Inbound calls to ALL numbers show: "This number is not configured. Please contact support."

Even after assigning numbers via the admin panel.

## Possible Causes

1. **Format Mismatch** - Database has `+447700158258` but Twilio sends `447700158258` (no +)
2. **Hidden Characters** - Spaces, dashes, or invisible characters in database
3. **Database Not Updating** - Assignment API failing silently
4. **RLS Policies** - Row Level Security blocking the webhook query
5. **Webhook URL Wrong** - Twilio configured to wrong endpoint

---

## Step 1: Deploy with Debug Logs

The latest code includes detailed debugging. Deploy to Vercel:

```bash
git pull
# Vercel auto-deploys from main branch
```

---

## Step 2: Check Database Directly

Run this in **Supabase SQL Editor**:

```sql
-- See ALL phone number assignments
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as name,
    vs.assigned_phone_number,
    LENGTH(vs.assigned_phone_number) as phone_length,
    vs.created_at,
    vs.updated_at
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
ORDER BY vs.updated_at DESC NULLS LAST;
```

**Check:**
- ✅ Do you see the phone numbers you assigned?
- ✅ Do they start with `+44`?
- ✅ Are there exactly 13 characters? (e.g., `+447700158258` = 13 chars)
- ⚠️ Are there any spaces or dashes? (`+44 7700 158258` would be 16 chars)

---

## Step 3: Make Test Call & Check Logs

1. **Call your assigned number** from your mobile phone
2. **Immediately open Vercel logs** (Functions tab, real-time logs)
3. **Look for the debug output:**

```
🔍 Looking up phone number: +447700158258
🔍 Phone number length: 13
🔍 Phone number chars: +(43) 4(52) 4(52) 7(55) ...
📋 All phone numbers in database: [
  { phone: '+447700158258', length: 13, matches: true },
  { phone: '+441474554816', length: 13, matches: false }
]
```

---

## Step 4: Compare Formats

From the Vercel logs, check:

### What Twilio Sends (from webhook):
```
📞 Twilio voice webhook: {
  to: '+447700158258'  ← NOTE THE FORMAT
}
```

### What's in Database:
```
📋 All phone numbers in database: [
  { phone: '+447700158258', matches: true }  ← SHOULD MATCH!
]
```

### If They Don't Match:

| Twilio Sends | Database Has | Problem |
|--------------|-------------|---------|
| `+447700158258` | `447700158258` | Missing `+` in database |
| `+447700158258` | `+44 7700 158258` | Spaces in database |
| `+447700158258` | `+44-7700-158258` | Dashes in database |
| `447700158258` | `+447700158258` | Twilio not sending `+` |

---

## Step 5: Fix Format Mismatch

### If Database is Missing `+`:

Update all numbers to include `+`:

```sql
UPDATE user_voip_settings
SET
    assigned_phone_number = '+' || assigned_phone_number,
    caller_id_number = '+' || caller_id_number,
    updated_at = NOW()
WHERE assigned_phone_number NOT LIKE '+%'
  AND assigned_phone_number IS NOT NULL;
```

### If Database Has Spaces/Dashes:

Remove all spaces and dashes:

```sql
UPDATE user_voip_settings
SET
    assigned_phone_number = REPLACE(REPLACE(assigned_phone_number, ' ', ''), '-', ''),
    caller_id_number = REPLACE(REPLACE(caller_id_number, ' ', ''), '-', ''),
    updated_at = NOW()
WHERE assigned_phone_number LIKE '% %'
   OR assigned_phone_number LIKE '%-%';
```

---

## Step 6: Check Twilio Webhook Configuration

The webhook MUST point to your voice endpoint, not the status callback.

1. Go to Twilio Console: https://console.twilio.com/
2. Click **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on **+447700158258** (or any of your numbers)
4. Scroll to **Voice & Fax** section
5. **A CALL COMES IN** should be set to:
   ```
   Webhook: https://your-app.vercel.app/api/webhooks/twilio/voice
   HTTP POST
   ```

**NOT:**
- ❌ `https://your-app.vercel.app/api/webhooks/twilio/status` (this is status callback)
- ❌ `https://your-app.vercel.app/api/calling/make-call` (this is outbound)

### Apply to All Numbers:

You need to configure EVERY purchased number with this webhook URL.

---

## Step 7: Check RLS Policies

The webhook uses **service role key**, so RLS shouldn't be an issue. But let's verify:

```sql
-- Check if RLS is blocking the query
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_voip_settings';

-- Should show: rowsecurity = true or false (doesn't matter, service role bypasses it)
```

If you see policies listed:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_voip_settings';
```

The webhook query should work regardless because it uses `createClient()` from server which uses service role.

---

## Step 8: Test with cURL

Simulate what Twilio sends:

```bash
curl -X POST "https://your-app.vercel.app/api/webhooks/twilio/voice" \
  -d "CallSid=TEST123" \
  -d "From=+447707970661" \
  -d "To=+447700158258" \
  -d "Direction=inbound" \
  -d "CallStatus=ringing"
```

Check Vercel logs to see:
1. Is the phone number being looked up correctly?
2. Are all database numbers shown?
3. Does the match comparison work?

---

## Expected Debug Output (Success)

When everything works, you should see:

```
📞 Twilio voice webhook: {
  callSid: 'CA...',
  from: '+447707970661',
  to: '+447700158258',
  direction: 'inbound',
  callStatus: 'ringing'
}
🔍 Looking up phone number: +447700158258
🔍 Phone number length: 13
📋 All phone numbers in database: [
  {
    phone: '+447700158258',
    length: 13,
    matches: true  ← SHOULD BE TRUE!
  }
]
🔍 Lookup result: { user_id: '...', assigned_phone_number: '+447700158258' }
✅ Routing inbound call to user: user_2abc...
```

---

## Most Likely Issue

Based on "tried assigning that number between users and the same issue happens", the problem is likely:

### Theory 1: Twilio Webhook Not Configured
- You're assigning numbers in the database ✅
- But Twilio doesn't know to send calls to your webhook ❌
- **Fix:** Configure webhook URL in Twilio Console for each number

### Theory 2: Format Mismatch
- Database has numbers in one format
- Twilio sends numbers in different format
- **Fix:** Check logs and normalize format in database

### Theory 3: Multiple Numbers, All Failing
- If ALL numbers fail, it's not about assignment
- It's about webhook configuration or RLS
- **Fix:** Check Twilio webhook URL configuration

---

## Quick Test

Run this SQL to see what you have:

```sql
SELECT
    '=== CURRENT ASSIGNMENTS ===' as section,
    u.email,
    vs.assigned_phone_number,
    vs.updated_at as last_changed
FROM user_voip_settings vs
JOIN users u ON u.id = vs.user_id
ORDER BY vs.updated_at DESC;
```

Then **call each number** and check if ANY of them work.

- **If NONE work** → Twilio webhook configuration issue
- **If SOME work** → Format mismatch or specific number issue
- **If logs show nothing** → Webhook not being called at all

---

## Next Steps

1. ✅ Deploy latest code (with debug logs)
2. ⚠️ Make test call
3. ⚠️ Check Vercel logs for debug output
4. ⚠️ Share the exact log output here
5. We'll identify the exact mismatch and fix it

---

**The debug logs will tell us EXACTLY what's wrong!**
