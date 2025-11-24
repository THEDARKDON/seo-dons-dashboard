# SMS & Email Messaging System - Implementation & Testing Guide

## Overview
Complete guide for implementing and testing the SMS and email messaging system integrated with Twilio and Google Workspace.

---

## Phase 1: Database Setup

### Step 1: Run Database Migrations

You need to run the migration file that adds the `scheduled_for` column:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/027_add_scheduled_sms.sql

ALTER TABLE sms_messages
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_sms_scheduled_for
ON sms_messages(scheduled_for)
WHERE status = 'queued';
```

**How to run:**
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL
4. Click "Run"

### Step 2: Verify Tables Exist

Check that these tables exist from the previous migration (026_sms_email_system.sql):
- `sms_messages`
- `sms_templates`
- `email_messages`
- `email_templates`

---

## Phase 2: Twilio SMS Configuration

### Step 1: Configure Twilio SMS Webhook

For each Twilio phone number assigned to your SDRs:

1. Log into [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers → Manage → Active Numbers**
3. Click on each phone number
4. Scroll to **Messaging Configuration**
5. Set the following:

**When a message comes in:**
- **Webhook URL**: `https://www.seodonscrm.co.uk/api/twilio/sms/webhook`
- **HTTP Method**: POST

**Delivery Status Callback:**
- **Callback URL**: `https://www.seodonscrm.co.uk/api/twilio/sms/status`
- **HTTP Method**: POST

6. Click **Save**

### Step 2: Enable SMS on User Phone Numbers

In your database, verify that users have `sms_enabled = true`:

```sql
UPDATE user_voip_settings
SET sms_enabled = true
WHERE assigned_phone_number IS NOT NULL;
```

---

## Phase 3: Google Workspace Email Configuration

### Step 1: Create Google Cloud Project (if not already done)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Name it "SEO Dons CRM" or similar

### Step 2: Enable Gmail API

1. In Google Cloud Console, go to **APIs & Services → Library**
2. Search for "Gmail API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - **App name**: SEO Dons CRM
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**

### Step 4: Add OAuth Scopes

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
3. Click **Save and Continue**

### Step 5: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Choose **Web application**
4. Name it "SEO Dons CRM Web"
5. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/email/callback`
   - Production: `https://www.seodonscrm.co.uk/api/email/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### Step 6: Add Environment Variables

Add to your `.env.local` (development) and Vercel (production):

```bash
# Gmail API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Step 7: Deploy to Vercel

Since environment variables changed, redeploy:

```bash
git add .
git commit -m "Add SMS and Email messaging system"
git push origin main
```

Then in Vercel:
1. Go to **Settings → Environment Variables**
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Trigger new deployment

---

## Phase 4: Testing

### Test 1: SMS Messaging Interface

**Objective**: Test the SMS conversation view

1. Navigate to `/dashboard/sms`
2. **Expected**: You should see an empty state saying "No conversations yet"
3. The page should have:
   - Conversation sidebar on the left
   - Search bar at the top
   - Empty message area on the right

**Screenshot location**: [dashboard/sms](http://localhost:3000/dashboard/sms)

---

### Test 2: Receive Inbound SMS

**Objective**: Test receiving SMS from a lead/contact

**Setup:**
1. Find your assigned Twilio phone number (e.g., +447700158258)
2. From your personal mobile, send an SMS to that number
3. Text message: "Hi, I'm interested in your services"

**Expected Results:**
1. SMS should appear in the conversation list within 5 seconds
2. Conversation should show:
   - Phone number formatted as +44 7700 158258
   - Message preview
   - "X minutes ago" timestamp
   - Unread count badge (1)
3. Click on the conversation
4. Message should appear in the thread on the right
5. Message should be styled with gray background (inbound)

**Troubleshooting:**
- If message doesn't appear, check Twilio webhook logs:
  - Go to Twilio Console → Monitor → Logs → Webhooks
  - Look for POST to `/api/twilio/sms/webhook`
- Check browser console for errors

---

### Test 3: Send Outbound SMS

**Objective**: Reply to an SMS conversation

1. With a conversation open (from Test 2)
2. Type a message in the composer: "Thanks for reaching out! How can I help?"
3. Press Enter or click Send button

**Expected Results:**
1. Message should appear in the thread immediately
2. Message styled with blue background (outbound)
3. Should show single checkmark (✓) for "sent"
4. After a few seconds, should show double checkmark (✓✓) for "delivered"
5. Your mobile phone should receive the SMS

**Troubleshooting:**
- If send fails, check browser Network tab for `/api/sms/send` response
- Verify `assigned_phone_number` in `user_voip_settings` table

---

### Test 4: Post-Call SMS Modal

**Objective**: Test automatic SMS prompt after call

**Setup:**
1. Navigate to `/dashboard/leads`
2. Click on a lead with a phone number
3. Click "Call" button
4. Make a call that lasts at least 6 seconds
5. Hang up the call

**Expected Results:**
1. After hanging up, a modal should appear: "Send Follow-up SMS"
2. Modal should show:
   - Contact's name and phone number
   - Template dropdown (may be empty if no templates created)
   - Message textarea
   - Send delay dropdown (immediate, 5min, 15min, 30min, 1hr)
   - "Skip" and "Send Now" buttons

3. Test sending:
   - Type a message: "Great speaking with you! Here's the information we discussed."
   - Click "Send Now"
   - Should see success alert
   - SMS should appear in the SMS page conversation list

**Troubleshooting:**
- If modal doesn't appear, check that call lasted > 5 seconds
- Check browser console for errors in call disconnect handler
- Verify contact lookup API works: `/api/contacts/lookup?phone=+44...`

---

### Test 5: Connect Google Workspace Email

**Objective**: Link your Gmail account for sending emails

1. Navigate to `/dashboard/settings`
2. Look for "Email Integration" section
3. Click "Connect Gmail" button

**Expected Results:**
1. Redirected to Google OAuth consent screen
2. Shows scopes being requested:
   - Send emails on your behalf
   - Read your email messages
   - View your email address
3. Click "Allow"
4. Redirected back to settings page
5. Should see "Gmail Connected" status with your email address
6. Should see "Disconnect" button

**Troubleshooting:**
- If redirect fails, verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check that redirect URI matches exactly in Google Cloud Console
- Check browser URL for error parameters: `?error=...`

---

### Test 6: Send Post-Call Email

**Objective**: Test email sending after a call

**Setup:**
1. Make a call to a lead/customer that has an email address
2. Call must last > 5 seconds
3. Hang up

**Expected Results:**
1. Post-call SMS modal appears first
2. Click "Skip" on SMS modal
3. Post-call Email modal should appear after 300ms
4. Modal should show:
   - Contact's name and email
   - Template dropdown
   - Subject line input
   - Message textarea (larger than SMS)
   - "Skip" and "Send Email" buttons

5. Test sending:
   - Subject: "Following up on our call"
   - Message: "Hi {name}, it was great speaking with you today. As discussed..."
   - Click "Send Email"
   - Should see success alert

6. Verify email sent:
   - Check your Gmail Sent folder
   - Email should appear there
   - Recipient should receive the email

**Troubleshooting:**
- If modal doesn't show, verify contact has email address
- If send fails with "Google account not connected", complete Test 5 first
- Check Network tab for `/api/email/send` response
- If token expired, it should auto-refresh

---

### Test 7: SMS Templates (Admin Only)

**Objective**: Create reusable SMS templates

**Setup:** Must be logged in as admin

1. Run this SQL to create a test template:

```sql
INSERT INTO sms_templates (name, content, category, is_active, auto_send_after_call, created_by)
VALUES (
  'Post-Call Follow-up',
  'Hi {first_name}, thanks for speaking with me today! Here''s a quick summary of what we discussed...',
  'post_call',
  true,
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

2. Make a call and hang up
3. When post-call SMS modal appears, click the template dropdown

**Expected Results:**
1. Template should appear in dropdown as "Post-Call Follow-up"
2. Select the template
3. Message textarea should auto-fill with template content
4. `{first_name}` should be replaced with actual contact's first name

---

### Test 8: Email Templates (Admin Only)

**Objective**: Create reusable email templates

**Setup:** Must be logged in as admin

1. Run this SQL to create a test template:

```sql
INSERT INTO email_templates (name, subject, content, category, is_active, auto_send_after_call, created_by)
VALUES (
  'Meeting Follow-up',
  'Thanks for the call, {name}',
  'Hi {name},

It was great speaking with you today. Here''s a summary of what we covered:

- Point 1
- Point 2
- Point 3

Let me know if you have any questions!

Best regards',
  'post_call',
  true,
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

2. Make a call and hang up
3. Skip SMS modal
4. When email modal appears, select the template

**Expected Results:**
1. Template should appear in dropdown
2. Subject line should auto-fill
3. Message should auto-fill with template content
4. `{name}` variables replaced with contact's name

---

### Test 9: SMS Conversation Search

**Objective**: Test searching conversations

**Setup:** Need at least 3 different SMS conversations

1. Navigate to `/dashboard/sms`
2. Type a phone number in the search box (e.g., "7700")

**Expected Results:**
1. Conversation list filters in real-time
2. Only conversations matching the search appear
3. Clear search - all conversations return

---

### Test 10: Scheduled SMS (Future Feature)

**Objective**: Schedule an SMS for later

**Setup:**
1. Make a call
2. In post-call SMS modal
3. Select "Send in 15 minutes" from delay dropdown
4. Type message: "Following up on our call earlier"
5. Click "Schedule SMS"

**Expected Results:**
1. Success message: "SMS scheduled to send in 15 minutes"
2. Check database:

```sql
SELECT * FROM sms_messages
WHERE status = 'queued'
AND scheduled_for IS NOT NULL
ORDER BY scheduled_for DESC;
```

3. Should see your scheduled message

**Note:** Currently, scheduled messages are stored but not automatically sent. You would need to implement a cron job or background worker to process them. For now, they're stored in the database ready for future automation.

---

## Phase 5: Production Checklist

Before launching to your team:

### SMS System
- [ ] All Twilio phone numbers have SMS webhook configured
- [ ] Test inbound SMS from multiple numbers
- [ ] Test outbound SMS delivery
- [ ] Create at least 3 post-call SMS templates
- [ ] Test post-call SMS modal on actual sales calls
- [ ] Verify SMS delivery status updates (✓✓)

### Email System
- [ ] Google OAuth app approved (if needed for production)
- [ ] All SDRs connect their Gmail accounts
- [ ] Test email sending from multiple users
- [ ] Create at least 3 post-call email templates
- [ ] Test post-call email modal
- [ ] Verify emails appear in Gmail Sent folder
- [ ] Test with various email clients (Gmail, Outlook, etc.)

### Database
- [ ] Run migration 027 in production Supabase
- [ ] Verify all tables have proper indexes
- [ ] Set up database backup schedule
- [ ] Test template creation/editing

### Monitoring
- [ ] Set up Twilio webhook error alerts
- [ ] Monitor Gmail API quota usage
- [ ] Set up logging for failed message sends
- [ ] Create dashboard for message metrics

---

## Common Issues & Solutions

### Issue: "No phone number assigned to your account"
**Solution:** Run this SQL to assign a phone number:
```sql
UPDATE user_voip_settings
SET assigned_phone_number = '+447700158258',
    sms_enabled = true
WHERE user_id = (SELECT id FROM users WHERE clerk_id = 'your_clerk_id');
```

### Issue: SMS webhook returns 404
**Solution:**
- Verify webhook URL is exactly: `https://www.seodonscrm.co.uk/api/twilio/sms/webhook`
- Check that route file exists at `app/api/twilio/sms/webhook/route.ts`
- Redeploy to Vercel

### Issue: "Google account not connected"
**Solution:**
- Complete Test 5 to connect Gmail
- Check `user_integrations` table for provider='google'
- Verify tokens haven't expired

### Issue: Post-call modals don't appear
**Solution:**
- Call must last > 5 seconds
- Check browser console for JavaScript errors
- Verify `PostCallSMSModal` component is imported in `voice-call-panel.tsx`
- Refresh browser to get latest code

### Issue: Templates don't load
**Solution:**
- Verify templates exist in database with correct category ('post_call')
- Check browser Network tab for `/api/sms/templates` or `/api/email/templates` response
- Verify templates have `is_active = true`

### Issue: Scheduled SMS not sending
**Solution:**
- This is expected - scheduled messages are stored but not yet automatically processed
- You need to implement a cron job/background worker
- For now, messages are queued in the database for future automation

---

## API Endpoints Reference

### SMS Endpoints
- `POST /api/sms/send` - Send SMS
- `GET /api/sms/conversations` - List conversations
- `GET /api/sms/messages?conversation={phone}` - Get messages
- `POST /api/sms/schedule` - Schedule SMS for later
- `GET /api/sms/templates` - List templates
- `POST /api/twilio/sms/webhook` - Receive inbound SMS (Twilio)
- `POST /api/twilio/sms/status` - Delivery status (Twilio)

### Email Endpoints
- `POST /api/email/send` - Send email via Gmail
- `GET /api/email/connect` - Get Google OAuth URL
- `GET /api/email/callback` - OAuth callback
- `GET /api/email/templates` - List templates

### Utility Endpoints
- `GET /api/contacts/lookup?phone={number}` - Lookup contact by phone

---

## Next Steps (Future Enhancements)

1. **Scheduled Message Processing**
   - Implement Vercel Cron or background job
   - Process messages where `scheduled_for <= NOW()`
   - Send via Twilio/Gmail and update status

2. **Email Receiving**
   - Set up Gmail webhook (push notifications)
   - Parse incoming emails
   - Link to conversations

3. **Message Templates Admin UI**
   - Create admin page for managing templates
   - Visual template editor
   - Variable picker ({name}, {company}, etc.)

4. **Bulk SMS**
   - Send SMS to multiple leads at once
   - Campaign management
   - Track deliverability stats

5. **Email Campaigns**
   - Bulk email sending
   - Email scheduling
   - Open/click tracking

6. **WhatsApp Integration**
   - Twilio WhatsApp API
   - Similar to SMS but with media support

---

## Support

If you encounter issues not covered in this guide:

1. Check browser console for errors
2. Check Twilio Console logs
3. Check Vercel function logs
4. Review database for data issues
5. Test in incognito mode (rules out browser cache)

**Database Query Examples:**

```sql
-- Check recent SMS messages
SELECT * FROM sms_messages
ORDER BY created_at DESC
LIMIT 10;

-- Check user phone assignments
SELECT u.first_name, u.last_name, v.assigned_phone_number, v.sms_enabled
FROM users u
LEFT JOIN user_voip_settings v ON u.id = v.user_id;

-- Check Google integrations
SELECT u.first_name, u.last_name, ui.provider, ui.metadata->>'email' as connected_email
FROM users u
LEFT JOIN user_integrations ui ON u.id = ui.user_id
WHERE ui.provider = 'google';

-- Count messages by user
SELECT u.first_name, u.last_name,
       COUNT(*) as total_messages,
       SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as sent,
       SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as received
FROM sms_messages sm
JOIN users u ON sm.user_id = u.id
GROUP BY u.id, u.first_name, u.last_name;
```

---

## Summary

You've implemented:
- ✅ SMS messaging interface with conversation view
- ✅ Inbound/outbound SMS via Twilio
- ✅ Post-call SMS modal with templates
- ✅ Scheduled SMS (database layer)
- ✅ Gmail integration via OAuth
- ✅ Post-call email modal with templates
- ✅ Email sending via Gmail API
- ✅ Contact lookup for auto-populating follow-ups
- ✅ Real-time message updates (polling)
- ✅ Message read/unread tracking
- ✅ Delivery status tracking (SMS)

The system is production-ready for manual follow-ups. Automated features (scheduled send, email receiving) require additional infrastructure.
