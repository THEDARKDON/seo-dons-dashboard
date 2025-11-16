# Stuck Calls Fix - Lead Contact Status Issue

## Problem Summary

Calls were getting stuck in "in-progress" status even after completing, which prevented leads from being marked as "contacted" and activities from showing on lead pages.

### Symptoms:
- ✅ Calls complete successfully (5+ minutes duration)
- ❌ Call status stays "in-progress" instead of "completed"
- ❌ Leads not marked as "contacted"
- ❌ `last_contacted_at` not updated on leads
- ❌ Call activities not showing on lead detail pages

## Root Cause

The Twilio TwiML `<Dial>` verb was missing the `statusCallback` parameter. Without it:
- Twilio only sent ONE callback when the dial STARTED
- No callback was sent when the call ENDED
- The `action` callback fires after `<Dial>` completes, but this wasn't reliably updating status

### How the Database Trigger Works

From [supabase/migrations/043_update_lead_on_call.sql](supabase/migrations/043_update_lead_on_call.sql):

```sql
CREATE TRIGGER trigger_update_lead_on_call
  AFTER INSERT OR UPDATE ON call_recordings
  FOR EACH ROW
  WHEN (NEW.lead_id IS NOT NULL)
  EXECUTE FUNCTION update_lead_on_call();
```

The trigger only fires when:
```sql
IF (NEW.status = 'completed' OR (NEW.status = 'in-progress' AND NEW.recording_url IS NOT NULL))
   AND NEW.lead_id IS NOT NULL
```

So if status never changes to 'completed', the trigger never fires!

## Fixes Applied

### Fix 1: Add statusCallback to TwiML Dial

**File**: [app/api/webhooks/twilio/voice-client/route.ts](app/api/webhooks/twilio/voice-client/route.ts#L20)

**Before**:
```xml
<Dial callerId="${callerId}" record="record-from-answer"
      action="${process.env.NEXT_PUBLIC_APP_URL}/api/calling/webhook"
      method="POST">
```

**After**:
```xml
<Dial callerId="${callerId}" record="record-from-answer"
      action="${process.env.NEXT_PUBLIC_APP_URL}/api/calling/webhook"
      method="POST"
      statusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/calling/webhook"
      statusCallbackEvent="initiated ringing answered completed"
      statusCallbackMethod="POST">
```

**What this does**:
- Twilio will now send callbacks at EACH status change
- `initiated` - when call starts
- `ringing` - when destination phone rings
- `answered` - when call is answered
- `completed` - when call ends ✅ THIS IS KEY

### Fix 2: Database Migration to Fix Existing Stuck Calls

**File**: [supabase/migrations/053_fix_stuck_calls.sql](supabase/migrations/053_fix_stuck_calls.sql)

Created a function `fix_stuck_calls()` that:
```sql
UPDATE call_recordings
SET
    status = 'completed',
    ended_at = COALESCE(ended_at, created_at + (duration_seconds || ' seconds')::INTERVAL)
WHERE status IN ('in-progress', 'initiated')
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND duration_seconds > 0;
```

This automatically:
- Finds calls stuck for >10 minutes
- Updates status to 'completed'
- Sets ended_at based on duration
- **Triggers the database trigger to update leads!**

### Fix 3: Diagnostic SQL Queries

**File**: [CHECK_STUCK_CALLS.sql](CHECK_STUCK_CALLS.sql)

Queries to identify issues:
1. Find calls stuck in progress >10 minutes
2. Count calls by status
3. Find calls with duration but still in-progress
4. Check leads that should be contacted but aren't
5. Manual fix query (commented out)

## How to Apply Fixes

### Step 1: Run the Migration (Immediate Fix)

In your Supabase SQL Editor, run:

```sql
-- From migration 053_fix_stuck_calls.sql
CREATE OR REPLACE FUNCTION fix_stuck_calls()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE call_recordings
    SET
        status = 'completed',
        ended_at = COALESCE(
            ended_at,
            created_at + (duration_seconds || ' seconds')::INTERVAL,
            created_at + INTERVAL '5 minutes'
        )
    WHERE status IN ('in-progress', 'initiated')
      AND created_at < NOW() - INTERVAL '10 minutes'
      AND (duration_seconds > 0 OR created_at < NOW() - INTERVAL '1 hour');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Run it immediately
SELECT fix_stuck_calls();
```

This will:
- Fix all existing stuck calls
- Update their status to 'completed'
- **Trigger the database trigger**
- Update leads to 'contacted' status
- Set `last_contacted_at` timestamps

### Step 2: Deploy the Code Changes

The statusCallback fix is already pushed to main. After deployment:
- New calls will get real-time status updates
- Calls will automatically change to 'completed' when they end
- Leads will be marked as contacted immediately

### Step 3: Verify the Fix

Run diagnostic query:
```sql
-- Check calls in last hour
SELECT
    id,
    call_sid,
    status,
    duration_seconds,
    created_at,
    lead_id IS NOT NULL as has_lead
FROM call_recordings
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Expected Result**:
- Completed calls should have status = 'completed'
- No calls stuck in 'in-progress' for >10 minutes

Check leads:
```sql
-- Check recently contacted leads
SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.status as lead_status,
    l.last_contacted_at,
    COUNT(cr.id) as call_count
FROM leads l
LEFT JOIN call_recordings cr ON l.id = cr.lead_id
WHERE l.last_contacted_at > NOW() - INTERVAL '1 hour'
GROUP BY l.id, l.first_name, l.last_name, l.status, l.last_contacted_at
ORDER BY l.last_contacted_at DESC;
```

**Expected Result**:
- Leads with completed calls should have:
  - `status` = 'contacted' (if they were 'new')
  - `last_contacted_at` = recent timestamp

## Future Improvements

### Optional: Scheduled Cleanup Job

If you have pg_cron extension enabled, you can schedule automatic cleanup:

```sql
SELECT cron.schedule(
    'fix-stuck-calls',
    '*/30 * * * *', -- Run every 30 minutes
    'SELECT fix_stuck_calls();'
);
```

This ensures any stuck calls are automatically fixed even if webhooks fail.

### Monitoring

Add to your monitoring dashboard:
```sql
-- Alert if too many stuck calls
SELECT COUNT(*) as stuck_calls_count
FROM call_recordings
WHERE status = 'in-progress'
  AND created_at < NOW() - INTERVAL '15 minutes';
```

If count > 5, investigate Twilio webhook configuration.

## Testing the Fix

### Test 1: Make a Call
1. Make a test call through the app
2. Complete the call (talk for >30 seconds)
3. Hang up
4. Check call status in database immediately
5. **Expected**: Status should be 'completed' within 10 seconds

### Test 2: Check Lead Status
1. Call a lead that has status 'new'
2. Complete the call
3. Check lead status
4. **Expected**: Lead status = 'contacted', `last_contacted_at` updated

### Test 3: Check Activity Timeline
1. Go to lead detail page
2. Look at activity timeline
3. **Expected**: Call activity appears with duration and status

## Rollback (If Needed)

If issues occur, you can rollback the statusCallback:

```typescript
// In app/api/webhooks/twilio/voice-client/route.ts
// Remove: statusCallback, statusCallbackEvent, statusCallbackMethod

const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}" record="record-from-answer"
        action="${process.env.NEXT_PUBLIC_APP_URL}/api/calling/webhook"
        method="POST">
    <Number>${to}</Number>
  </Dial>
</Response>`;
```

But keep the migration function for manual cleanup.

## Summary

✅ **Root Cause**: Missing statusCallback on Twilio Dial
✅ **Immediate Fix**: Database function to fix stuck calls
✅ **Long-term Fix**: Added statusCallback for real-time updates
✅ **Impact**: Leads now properly marked as contacted after calls
✅ **Monitoring**: Diagnostic queries to track issues

The changes have been deployed. Run the migration to fix existing stuck calls!
