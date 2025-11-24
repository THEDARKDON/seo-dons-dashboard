# Auto-Send SMS/Email Implementation

## Overview
Automatic SMS and Email messages are sent after calls complete based on configurable templates.

## How It Works

### 1. Call Completion Trigger
When a call completes, the SignalWire webhook ([app/api/calling/webhook/route.ts](app/api/calling/webhook/route.ts)) automatically triggers the auto-send system.

**Supported call statuses:**
- `completed` - Call answered and completed
- `no-answer` - Call not answered
- `busy` - Number was busy
- `failed` - Call failed

### 2. Auto-Send Processing
The auto-send handler ([app/api/calling/auto-send/route.ts](app/api/calling/auto-send/route.ts)) performs these steps:

1. **Fetch Call Details** - Gets call record with lead/customer data
2. **Determine Outcome** - Successful if `completed` with duration > 10 seconds
3. **Get Contact Info** - Extracts phone, email, name from lead or customer
4. **Query Templates** - Finds active auto-send templates for `post_call` category
5. **Replace Variables** - Personalizes message content:
   - `{first_name}` → Lead's first name
   - `{last_name}` → Lead's last name
   - `{name}` → Full name
   - `{company}` → Company name
6. **Schedule Messages** - Creates queued messages with delay
7. **Send or Queue** - Sends immediately if delay=0, otherwise schedules

### 3. Scheduled Message Processing
A Vercel cron job runs **every minute** to process scheduled messages.

**Endpoint:** [app/api/messages/process-scheduled/route.ts](app/api/messages/process-scheduled/route.ts)

**Process:**
1. Query SMS messages where `status='queued'` and `scheduled_for <= NOW()`
2. Query Email messages where `status='queued'`
3. Send via Twilio (SMS) or Gmail (Email)
4. Update status to `sent` or `failed`

### 4. Scheduled Message Processing Options

**⚠️ IMPORTANT:** Vercel Hobby (Free) plan does NOT support frequent cron jobs (only 1x daily max).

**Current Setup:**
- SMS with delay=0 → Sends immediately ✅
- Email → Sends immediately ✅
- SMS with delay (2-5 min) → Requires scheduled processing

**Option A: External Cron Service (Recommended for Free Plan)**

Use a free external service to trigger message processing:

1. **cron-job.org** (Free, Reliable)
   - Sign up at https://cron-job.org
   - Create job to call: `https://your-domain.vercel.app/api/messages/process-scheduled`
   - Schedule: Every 5 minutes
   - Method: POST or GET

2. **GitHub Actions** (Free for Public Repos)
   ```yaml
   # .github/workflows/cron-messages.yml
   name: Process Scheduled Messages
   on:
     schedule:
       - cron: '*/5 * * * *'
   jobs:
     process:
       runs-on: ubuntu-latest
       steps:
         - run: curl -X POST ${{ secrets.APP_URL }}/api/messages/process-scheduled
   ```

3. **Manual Trigger** (Testing/Development)
   ```bash
   curl -X POST https://your-domain.vercel.app/api/messages/process-scheduled \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

**Option B: Vercel Pro Plan ($20/month)**
- Add `vercel.json` with cron configuration
- Unlimited cron invocations
- Guaranteed timing

## Database Schema

### SMS Messages
**Table:** `sms_messages`

Key columns for auto-send:
- `status` - `queued`, `sent`, `delivered`, `failed`
- `scheduled_for` - When to send (NULL = send immediately)
- `call_id` - Links to originating call
- `lead_id` / `customer_id` - Links to contact
- `conversation_id` - Groups messages by phone number

### Email Messages
**Table:** `email_messages`

Key columns:
- `status` - `queued`, `sent`, `delivered`, `failed`
- `call_id` - Links to originating call
- `lead_id` / `customer_id` - Links to contact
- `conversation_id` - Groups by email or thread

### Templates
**Tables:** `sms_templates`, `email_templates`

Key columns:
- `auto_send_after_call` - Enable auto-send (boolean)
- `auto_send_delay_minutes` - Delay before sending (SMS only)
- `category` - `post_call` for post-call messages
- `is_active` - Template must be active
- `body` / `body_html` - Message content with variables

## User Interface

### Auto Send Settings Page
**Path:** [/dashboard/auto-send](http://localhost:3000/dashboard/auto-send)
**File:** [app/dashboard/auto-send/page.tsx](app/dashboard/auto-send/page.tsx)

Features:
- Global enable/disable switch
- View all auto-send templates (SMS & Email)
- Toggle individual templates on/off
- See delay times and categories
- Link to template editor

### Template Management Page
**Path:** [/dashboard/settings/templates](http://localhost:3000/dashboard/settings/templates)
**File:** [app/dashboard/settings/templates/page.tsx](app/dashboard/settings/templates/page.tsx)

Features:
- Edit template content
- Configure auto-send settings
- Set delay times (SMS)
- Choose categories
- Manage personalization variables

## Default Templates

### SMS Templates
1. **Successful Call Follow-up**
   - Category: `post_call`
   - Delay: 5 minutes
   - Content: "Hi {first_name}, thank you for speaking with SEO Dons today! We're excited to help grow your business. Visit our website: https://www.seodons.com"

2. **Missed Call Follow-up**
   - Category: `post_call`
   - Delay: 2 minutes
   - Content: "Hi {first_name}, we tried to reach you from SEO Dons. Please give us a call back at your convenience: https://www.seodons.com"

### Email Templates
1. **Successful Call Follow-up Email**
   - Category: `post_call`
   - Subject: "Great speaking with you, {first_name}!"
   - Content: HTML email with SEO Dons branding

2. **Missed Call Follow-up Email**
   - Category: `post_call`
   - Subject: "We tried to reach you, {first_name}"
   - Content: HTML email requesting callback

## Environment Variables Required

```env
# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Google (for Email)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Secret (optional, for security)
CRON_SECRET=random_secret_key
```

## Testing Auto-Send

### Test 1: Make a Call
1. Go to dashboard and call a lead with phone and email
2. Complete the call (duration > 10 seconds)
3. Check SMS page - should see scheduled message
4. Wait for delay time to pass
5. Verify SMS sent on Twilio dashboard
6. Check Email page - should see sent email

### Test 2: Missed Call
1. Call a lead but don't answer (or let it go to voicemail quickly)
2. Check SMS/Email pages for "missed call" follow-up messages

### Test 3: Manual Trigger (Development)
```bash
# Trigger auto-send manually
curl -X POST http://localhost:3000/api/calling/auto-send \
  -H "Content-Type: application/json" \
  -d '{
    "callSid": "CA1234567890",
    "callStatus": "completed"
  }'

# Process scheduled messages manually
curl -X POST http://localhost:3000/api/messages/process-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test 4: Check Database
```sql
-- Check scheduled SMS messages
SELECT id, to_number, body, status, scheduled_for, created_at
FROM sms_messages
WHERE status = 'queued'
ORDER BY scheduled_for;

-- Check email messages
SELECT id, to_email, subject, status, created_at
FROM email_messages
WHERE status = 'queued'
ORDER BY created_at;

-- Check auto-send templates
SELECT name, category, auto_send_after_call, auto_send_delay_minutes, is_active
FROM sms_templates
WHERE auto_send_after_call = true;
```

## Troubleshooting

### Messages Not Sending
1. **Check templates are active**
   - Go to Auto Send settings
   - Verify templates are enabled (green checkmark)

2. **Check Vercel cron is configured**
   - Run `vercel crons ls` to list crons
   - Check Vercel dashboard → Settings → Crons

3. **Check database records**
   - Query `sms_messages` for `status='failed'`
   - Check `error_message` column

4. **Check logs**
   - Vercel dashboard → Logs
   - Filter for "auto-send" or "process-scheduled"

### Variables Not Replacing
- Ensure lead/customer has `first_name`, `last_name`, `company` fields populated
- Check template content includes correct variable syntax: `{first_name}` not `{firstName}`

### Emails Not Sending
1. **Check Gmail connection**
   - Go to Email page
   - Verify "Gmail Connected" status
   - Reconnect if expired

2. **Check user_integrations table**
   ```sql
   SELECT provider, metadata->>'email', token_expiry
   FROM user_integrations
   WHERE provider = 'google';
   ```

### SMS Not Sending
1. **Check Twilio credentials**
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in env vars

2. **Check user has phone number**
   ```sql
   SELECT user_id, phone_number
   FROM user_voip_settings;
   ```

## Future Enhancements

- [ ] Add email scheduling with delay (currently sends immediately)
- [ ] Support for conditional templates based on call duration, sentiment, etc.
- [ ] Template A/B testing
- [ ] Click tracking for email links
- [ ] SMS delivery confirmation webhooks
- [ ] Unsubscribe management
- [ ] Template analytics (open rates, click rates)
- [ ] Multi-language template support
- [ ] Rich media support (images, videos)
