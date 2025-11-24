# Auto-Send Testing Guide

## System is Now Live!

The auto-send system has been updated to work on Vercel's free tier without cron jobs. All messages now send **immediately** after calls complete.

---

## Prerequisites

Before testing, ensure:

1. **✅ Gmail Connected with Correct Scopes**
   - Go to `/dashboard/settings`
   - If already connected, click "Disconnect" first
   - Click "Connect Google Calendar" or "Connect Email"
   - Accept ALL permissions (Calendar + Gmail)
   - Verify you see the "Connected" status

2. **✅ Twilio Phone Number Assigned**
   - Check your user has a Twilio phone number in `user_voip_settings`
   - Query: `SELECT assigned_phone_number FROM user_voip_settings WHERE user_id = 'your-user-id'`

3. **✅ Templates Created**
   - Go to `/dashboard/settings/templates`
   - Create at least one SMS template with `auto_send_after_call = true`
   - Create at least one Email template with `auto_send_after_call = true`

---

## Test 1: Verify Templates Exist

### SQL Query
```sql
-- Check SMS templates
SELECT
  id,
  name,
  auto_send_after_call,
  auto_send_delay_minutes,
  category,
  is_active,
  body
FROM sms_templates
WHERE auto_send_after_call = true
  AND is_active = true;

-- Check Email templates
SELECT
  id,
  name,
  auto_send_after_call,
  category,
  is_active,
  subject,
  body_html
FROM email_templates
WHERE auto_send_after_call = true
  AND is_active = true;
```

### Expected Result
- At least 1 SMS template with `auto_send_after_call = true`
- At least 1 Email template with `auto_send_after_call = true`

### If No Templates
Go to `/dashboard/settings/templates` and create templates, OR run:

```sql
-- Create test SMS template
INSERT INTO sms_templates (
  name,
  body,
  category,
  is_active,
  auto_send_after_call,
  auto_send_delay_minutes
) VALUES (
  'Post-Call Follow Up',
  'Hi {first_name}, thanks for speaking with me today! Let me know if you have any questions. - {name}',
  'post_call',
  true,
  true,
  0  -- Ignored now, all send immediately
);

-- Create test Email template
INSERT INTO email_templates (
  name,
  subject,
  body_html,
  category,
  is_active,
  auto_send_after_call
) VALUES (
  'Post-Call Thank You',
  'Great speaking with you, {first_name}!',
  '<p>Hi {first_name},</p><p>Thank you for taking the time to speak with me today about {company}. I look forward to our next conversation!</p><p>Best regards</p>',
  'post_call',
  true,
  true
);
```

---

## Test 2: Make a Test Call

### Steps

1. **Create a Test Lead with Contact Info**
   ```sql
   INSERT INTO leads (
     user_id,
     first_name,
     last_name,
     email,
     phone,
     company,
     status
   ) VALUES (
     'your-user-id',  -- Replace with your user ID
     'Test',
     'Contact',
     'your-email@example.com',  -- Use YOUR email to receive test
     '+1234567890',  -- Use YOUR phone to receive test SMS
     'Test Company',
     'new'
   ) RETURNING id;
   ```

2. **Make a Call to This Lead**
   - Use the CRM to call the test lead
   - Answer the call if you used your real number
   - Complete the call (hang up)

3. **Check Twilio Webhook Logs**
   - Watch Vercel logs for `[Auto-Send]` entries
   - Should see: `[Auto-Send] Sending SMS via template "..." to +1234567890`
   - Should see: `[Auto-Send] Sending Email via template "..." to your-email@example.com`

---

## Test 3: Verify Messages Created in Database

### Immediately After Call (within 30 seconds)

```sql
-- Check SMS created
SELECT
  id,
  status,
  to_number,
  body,
  message_sid,
  error_message,
  created_at,
  updated_at
FROM sms_messages
ORDER BY created_at DESC
LIMIT 5;

-- Check Email created
SELECT
  id,
  status,
  to_email,
  subject,
  gmail_message_id,
  error_message,
  created_at,
  updated_at
FROM email_messages
ORDER BY created_at DESC
LIMIT 5;
```

### Expected Results

**SMS:**
- Status should be `'sent'` (not 'queued')
- `message_sid` should be populated (Twilio SID)
- `error_message` should be NULL
- `created_at` and `updated_at` should be within seconds of each other

**Email:**
- Status should be `'sent'`
- `gmail_message_id` should be populated
- `error_message` should be NULL

### If Status is 'failed'
Check the `error_message` column for details:
- **SMS:** Usually Twilio account issues or invalid phone number
- **Email:** Usually Gmail OAuth scope issues (need to reconnect)

---

## Test 4: Verify Actual Delivery

### Check Your Phone
- Should receive SMS within 30 seconds of call ending
- SMS should have variables replaced (e.g., "Hi Test" not "Hi {first_name}")

### Check Your Email Inbox
- Should receive email within 1 minute of call ending
- Email should have variables replaced
- Subject line should be personalized

---

## Test 5: Background Processor (Retry Logic)

### Manually Create a Stuck Message

```sql
-- Create a stuck SMS (simulate a failed send from 10 minutes ago)
INSERT INTO sms_messages (
  user_id,
  from_number,
  to_number,
  direction,
  body,
  status,
  conversation_id,
  created_at
) VALUES (
  'your-user-id',
  '+your-twilio-number',
  '+your-phone',
  'outbound',
  'This is a retry test message',
  'sending',  -- Stuck in 'sending' state
  '+your-phone',
  NOW() - INTERVAL '10 minutes'  -- Created 10 minutes ago
) RETURNING id;
```

### Trigger Background Processor

Navigate to any page in the dashboard (e.g., `/dashboard/leads`)

### Check Logs

Should see in Vercel logs:
```
[Background] Found 1 stuck SMS messages, retrying...
[Background] ✅ Retried SMS <id> successfully
```

### Verify Message Status Changed

```sql
SELECT id, status, message_sid, updated_at
FROM sms_messages
WHERE id = 'the-stuck-message-id';
```

Should now be `status = 'sent'` with `message_sid` populated.

---

## Troubleshooting

### Issue: No Auto-Send Triggered

**Check 1:** Verify webhook is calling auto-send
```
Vercel Logs → Search for "Auto-Send"
```

**Check 2:** Verify call has lead/customer associated
```sql
SELECT id, lead_id, customer_id, status
FROM call_recordings
WHERE call_sid = 'your-call-sid';
```

**Fix:** Calls need a `lead_id` or `customer_id` to trigger auto-send.

---

### Issue: SMS Shows 'failed'

**Common Errors:**

1. **"The 'To' number is not a valid phone number"**
   - Fix: Use E.164 format (+1234567890)
   - Update lead: `UPDATE leads SET phone = '+1234567890' WHERE id = 'lead-id'`

2. **"Account not authorized to send to this number"**
   - Fix: Twilio trial accounts can only send to verified numbers
   - Verify number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

3. **"Authentication Error"**
   - Fix: Check environment variables
   - Verify: `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set

---

### Issue: Email Shows 'failed'

**Common Errors:**

1. **"Request had insufficient authentication scopes"**
   - Fix: Reconnect Gmail with all scopes
   - Go to `/dashboard/settings` → Disconnect → Reconnect
   - Accept ALL permissions

2. **"User not found" or "No Gmail connected"**
   - Fix: User needs to connect Gmail first
   - Go to `/dashboard/email` → Click "Connect Gmail Account"

3. **"Failed to send email: 500"**
   - Check Vercel logs for detailed error
   - Usually OAuth token expired - reconnect Gmail

---

### Issue: Background Processor Not Running

**Check 1:** Verify component is loaded
```
Browser DevTools → Network tab → Look for POST to /api/messages/process-background
```

**Check 2:** Verify it runs on navigation
- Navigate between dashboard pages
- Should see POST request on each navigation

**Fix:** Clear browser cache and reload

---

## Monitoring Auto-Send

### Real-Time Monitoring

Watch Vercel logs with filters:
```
[Auto-Send]   → Main auto-send logic
[SMS]         → SMS sending
[Email]       → Email sending
[Background]  → Background retry processor
```

### Database Monitoring

```sql
-- Message status breakdown (last 24 hours)
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as first_message,
  MAX(created_at) as last_message
FROM sms_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Failed messages with errors
SELECT
  id,
  to_number,
  status,
  error_message,
  created_at
FROM sms_messages
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Success rate (last 24 hours)
SELECT
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'sent') /
    COUNT(*),
    2
  ) as success_rate_percent
FROM sms_messages
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## Expected Performance

### Timing
- **SMS:** Sent within 5-10 seconds of call ending
- **Email:** Sent within 10-30 seconds of call ending
- **Background Retry:** Runs on next page navigation (5+ minutes after stuck)

### Success Rates
- **SMS:** >95% success rate (failures usually invalid numbers)
- **Email:** >98% success rate (failures usually OAuth issues)

### Known Limitations
- ❌ No delays (all messages send immediately)
- ❌ Template delay settings are ignored
- ✅ Messages send reliably (vs. 0% before)
- ✅ Works on Vercel free tier
- ✅ No external cron needed

---

## Next Steps After Testing

1. **Create Production Templates**
   - Go to `/dashboard/settings/templates`
   - Create professional SMS/Email templates
   - Use variables: `{first_name}`, `{last_name}`, `{company}`
   - Enable auto-send for relevant categories

2. **Monitor First Week**
   - Check daily for failed messages
   - Review error messages
   - Adjust templates based on feedback

3. **Optional: Add Delays Later**
   - If delays are critical, consider:
     - Option A: Upgrade to Vercel Pro ($20/month) for cron
     - Option B: Use Twilio's native scheduling (paid feature)
     - Option C: External cron service (free but requires setup)

---

## Support

If tests fail, check:
1. Vercel logs for error details
2. Database for message status and errors
3. Gmail/Twilio account status
4. This guide's troubleshooting section

All auto-send logic is in:
- `app/api/calling/auto-send/route.ts` - Main auto-send logic
- `app/api/messages/process-background/route.ts` - Retry logic
- `app/api/calling/webhook/route.ts` - Trigger (line 82-89)
