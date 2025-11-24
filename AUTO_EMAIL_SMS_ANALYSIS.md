# Auto-Email and Auto-SMS System Analysis

## Executive Summary

The auto-email and auto-SMS systems are **architecturally complete** but **NOT OPERATIONAL** due to **missing cron job configuration**. The system creates scheduled messages but has no mechanism to process and send them.

---

## How the System is SUPPOSED to Work

### 1. Auto-Send Trigger Flow

```
Call Completes (Twilio Webhook)
    ↓
app/api/calling/webhook/route.ts (lines 80-94)
    ↓
Triggers: POST /api/calling/auto-send
    ↓
app/api/calling/auto-send/route.ts
    ↓
Queries active templates with auto_send_after_call=true
    ↓
Creates SMS/Email records with status='queued'
    ↓
If delay=0: Send immediately
    ↓
If delay>0: Store with scheduled_for timestamp
```

### 2. Template System

**Database Tables:**
- `sms_templates` - SMS message templates
- `email_templates` - Email message templates

**Template Fields:**
| Field | Purpose |
|-------|---------|
| `auto_send_after_call` | Enable/disable auto-send |
| `auto_send_delay_minutes` | Delay before sending (SMS only) |
| `category` | Filter: 'post_call', 'follow_up', 'appointment', etc. |
| `is_active` | Enable/disable template |

**Variable Substitution:**
Templates support variables:
- `{first_name}` → Contact's first name
- `{last_name}` → Contact's last name
- `{name}` → Full name
- `{company}` → Company name

### 3. Message Storage

**SMS Messages Table:** `sms_messages`
```sql
status: 'queued' | 'sent' | 'delivered' | 'failed'
scheduled_for: TIMESTAMP (when to send)
from_number: User's Twilio number
to_number: Contact's phone
body: Message text (with variables replaced)
```

**Email Messages Table:** `email_messages`
```sql
status: 'draft' | 'queued' | 'sent' | 'delivered' | 'failed'
from_email: User's Gmail address
to_email: Contact's email
subject: Email subject (with variables replaced)
body_html: HTML email body
```

### 4. Scheduled Processing (SHOULD HAPPEN)

**Endpoint:** `/api/messages/process-scheduled`

**What it does:**
1. Queries `sms_messages` where:
   - `status = 'queued'`
   - `scheduled_for <= NOW()`
   - Limit 50 messages
2. Sends each via Twilio API
3. Updates status to 'sent' or 'failed'
4. Queries `email_messages` where `status = 'queued'`
5. Sends each via `/api/email/send`
6. Updates status accordingly

**How it SHOULD be triggered:**
- Vercel Cron Job every 5 minutes
- OR external cron service (like cron-job.org)

---

## Why It's NOT Working

### Critical Issue #1: No Cron Job Configured

**Evidence:**
```bash
$ cat vercel.json
No vercel.json found
```

**Impact:**
- Messages are created with `status='queued'`
- Messages are stored with `scheduled_for` timestamp
- **NOTHING ever processes them**
- They sit in database forever as 'queued'

### Critical Issue #2: Gmail OAuth Scope Issue (Fixed)

**Previous Issue:**
- Email sending failed with "insufficient authentication scopes"
- Root cause: Token only had calendar scopes, not Gmail scopes

**Status:** ✅ FIXED in commit 394b36b
- Both OAuth flows now request all scopes together
- User needs to reconnect to get new token

### Critical Issue #3: Missing scheduled_for Column Check

**In auto-send route** ([app/api/calling/auto-send/route.ts:137](app/api/calling/auto-send/route.ts#L137)):
```typescript
scheduled_for: scheduledFor.toISOString(),
```

**Column exists?** Check migration 027:
```sql
-- supabase/migrations/027_add_scheduled_sms.sql
ALTER TABLE sms_messages
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
```

**Status:** ✅ Column should exist (IF migration was run)

### Critical Issue #4: Email Auto-Send Hardcoded to Immediate

**In auto-send route** ([app/api/calling/auto-send/route.ts:214](app/api/calling/auto-send/route.ts#L214)):
```typescript
// Send email immediately (no delay for emails in current implementation)
await sendEmailNow(email.id);
```

**Impact:**
- Email templates have `auto_send_delay_minutes` field
- BUT it's completely ignored
- All emails send immediately after call

### Critical Issue #5: Auto-Send Not Handling Lead/Customer Properly

**In auto-send route** ([app/api/calling/auto-send/route.ts:46-62](app/api/calling/auto-send/route.ts#L46-L62)):
```typescript
if (call.lead) {
  contactInfo = { /* lead data */ };
} else if (call.customer) {
  contactInfo = { /* customer data */ };
}
```

**Issue:** What if call has BOTH lead_id AND customer_id?
- Code prioritizes lead
- Customer data ignored
- May send to wrong contact

---

## Current System State

### What DOES Work:
1. ✅ Call webhook triggers auto-send endpoint
2. ✅ Templates are queried from database
3. ✅ Variables are replaced in message body
4. ✅ Messages are created in database with 'queued' status
5. ✅ Immediate sends (delay=0) work for SMS
6. ✅ Email templates are stored and managed

### What DOESN'T Work:
1. ❌ **Scheduled messages never get sent** (no cron job)
2. ❌ Email OAuth may still have insufficient scopes (needs reconnect)
3. ❌ Email delay settings are ignored
4. ❌ No monitoring/alerting for failed sends
5. ❌ No retry mechanism for failed sends
6. ❌ No user notification when auto-send fails

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CALL COMPLETES                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Twilio Webhook → /api/calling/webhook              │
│  • Updates call record                                       │
│  • Triggers auto-send (line 82-89)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            POST /api/calling/auto-send                       │
│  1. Get call details + contact info                         │
│  2. Query active auto-send templates                        │
│  3. Replace variables in template                           │
│  4. Create sms_messages record (status='queued')            │
│  5. Create email_messages record (status='queued')          │
│  6. If delay=0: Send immediately                            │
│  7. If delay>0: Store with scheduled_for timestamp          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE STORAGE                            │
│  • sms_messages: status='queued', scheduled_for set         │
│  • email_messages: status='queued'                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            ⚠️  MISSING CRON JOB  ⚠️                         │
│  SHOULD: Call /api/messages/process-scheduled every 5 min   │
│  ACTUAL: Nothing happens                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (if cron existed)
┌─────────────────────────────────────────────────────────────┐
│         GET/POST /api/messages/process-scheduled             │
│  1. Query queued SMS where scheduled_for <= NOW()           │
│  2. Send via Twilio API                                     │
│  3. Update status to 'sent' or 'failed'                     │
│  4. Query queued emails                                     │
│  5. Send via POST /api/email/send                           │
│  6. Update status                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## How to Fix

### Solution 1: Vercel Cron (Recommended for Vercel deployments)

**Create:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/messages/process-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Environment Variable:**
Add to Vercel dashboard:
```
CRON_SECRET=your-random-secret-here
```

**Redeploy:** Vercel will automatically register cron job

### Solution 2: External Cron Service

**Services:**
- cron-job.org (free)
- EasyCron (paid)
- UptimeRobot (free, limited)

**Configuration:**
```
URL: https://www.seodonscrm.co.uk/api/messages/process-scheduled
Method: GET or POST
Schedule: Every 5 minutes
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

### Solution 3: Database-Triggered Functions (Advanced)

**Supabase Edge Functions:**
- Create edge function to process messages
- Trigger via pg_cron extension
- Requires Supabase Pro plan

---

## Additional Fixes Needed

### Fix 1: Email Delay Support

**File:** `app/api/calling/auto-send/route.ts`

**Change line 214 from:**
```typescript
// Send email immediately (no delay for emails in current implementation)
await sendEmailNow(email.id);
```

**To:**
```typescript
// Check delay settings
if (template.auto_send_delay_minutes === 0) {
  await sendEmailNow(email.id);
} else {
  // Email will be processed by cron job
  console.log(`Email scheduled for ${template.auto_send_delay_minutes} minutes`);
}
```

**Add scheduled_for to email insert:**
```typescript
const scheduledFor = new Date(Date.now() + template.auto_send_delay_minutes * 60 * 1000);

const { data: email, error: emailError } = await supabase
  .from('email_messages')
  .insert({
    // ... existing fields ...
    scheduled_for: scheduledFor.toISOString(), // ADD THIS
  })
```

**Migration needed:**
```sql
-- Add scheduled_for column to email_messages
ALTER TABLE email_messages
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_email_scheduled_for
ON email_messages(scheduled_for)
WHERE status = 'queued';
```

### Fix 2: Update Process-Scheduled for Emails

**File:** `app/api/messages/process-scheduled/route.ts`

**Change line 80-85 from:**
```typescript
// Get all Email messages that are queued (emails don't use scheduled_for yet)
const { data: emailMessages, error: emailError } = await supabase
  .from('email_messages')
  .select('*')
  .eq('status', 'queued')
  .limit(50);
```

**To:**
```typescript
// Get all Email messages that are scheduled and ready to send
const { data: emailMessages, error: emailError } = await supabase
  .from('email_messages')
  .select('*')
  .eq('status', 'queued')
  .not('scheduled_for', 'is', null)
  .lte('scheduled_for', now)
  .limit(50);
```

### Fix 3: Reconnect Gmail for Scopes

**User action required:**
1. Go to `/dashboard/settings`
2. Disconnect Google Calendar (if connected)
3. Click "Connect Google Calendar"
4. Accept ALL permissions (Calendar + Gmail)
5. Test sending an email

---

## Testing the Fix

### Step 1: Verify Templates Exist
```sql
SELECT
  id,
  name,
  auto_send_after_call,
  auto_send_delay_minutes,
  category,
  is_active
FROM sms_templates
WHERE auto_send_after_call = true;

SELECT
  id,
  name,
  auto_send_after_call,
  category,
  is_active
FROM email_templates
WHERE auto_send_after_call = true;
```

### Step 2: Make a Test Call
1. Call a lead/customer
2. Complete the call
3. Check logs for auto-send trigger

### Step 3: Verify Messages Created
```sql
SELECT
  id,
  status,
  scheduled_for,
  to_number,
  body,
  created_at
FROM sms_messages
WHERE status = 'queued'
ORDER BY created_at DESC
LIMIT 10;

SELECT
  id,
  status,
  to_email,
  subject,
  created_at
FROM email_messages
WHERE status = 'queued'
ORDER BY created_at DESC
LIMIT 10;
```

### Step 4: Manually Trigger Cron (Before setting up actual cron)
```bash
curl -X POST https://www.seodonscrm.co.uk/api/messages/process-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 5: Verify Messages Sent
```sql
SELECT
  id,
  status,
  to_number,
  message_sid,
  error_message,
  created_at,
  updated_at
FROM sms_messages
WHERE id = 'your-message-id';
```

---

## Monitoring & Logging

### Add Logging to Auto-Send

**Recommended additions:**
```typescript
// Log when templates are found
console.log(`[Auto-Send] Found ${smsTemplates.length} SMS templates, ${emailTemplates.length} email templates`);

// Log when messages are created
console.log(`[Auto-Send] Created SMS message ${message.id} - scheduled for ${scheduledFor}`);

// Log when immediate send is triggered
console.log(`[Auto-Send] Sending SMS immediately (delay=0)`);

// Log when no contact info
console.warn(`[Auto-Send] No contact info for call ${callSid}`);
```

### Add Error Tracking

**Recommended:**
- Sentry integration for error tracking
- Dead letter queue for failed sends
- Admin dashboard showing failed auto-sends

---

## Summary

**Status:** 🟡 Partially Working

**What Works:**
- Template management ✅
- Auto-send triggering ✅
- Message creation ✅
- Immediate sends ✅

**What's Broken:**
- Scheduled message processing ❌ (NO CRON)
- Email delays ignored ❌
- Gmail scopes may be insufficient ❌ (needs user reconnect)

**Critical Fix:**
Create `vercel.json` with cron configuration and redeploy.

**Priority:**
1. **HIGH:** Add Vercel cron job
2. **HIGH:** User reconnects Gmail
3. **MEDIUM:** Add email delay support
4. **MEDIUM:** Add monitoring/alerting
5. **LOW:** Add retry mechanism
