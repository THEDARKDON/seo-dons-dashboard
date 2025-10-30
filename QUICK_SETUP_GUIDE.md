# Quick Setup Guide - SMS & Email System

## 🚀 Step-by-Step Setup (30 minutes)

---

## Part 1: Database Setup (5 minutes)

### Step 1: Run the Migration

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add scheduled_for column to sms_messages table
ALTER TABLE sms_messages
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add index for querying scheduled messages
CREATE INDEX IF NOT EXISTS idx_sms_scheduled_for
ON sms_messages(scheduled_for)
WHERE status = 'queued';
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 2: Verify Tables Exist

Run this query to check:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sms_messages', 'sms_templates', 'email_messages', 'email_templates');
```

You should see all 4 tables listed.

---

## Part 2: Twilio SMS Setup (10 minutes)

### Step 1: Log into Twilio

1. Go to: https://console.twilio.com/
2. Log in with your account

### Step 2: Configure Each Phone Number

**You need to do this for EVERY phone number assigned to your SDRs.**

1. In Twilio Console, click **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on the first phone number (e.g., +447700158258)

### Step 3: Set Up Messaging Webhooks

Scroll down to the **Messaging Configuration** section:

**A Message Comes In:**
- Select: `Webhook`
- Enter URL: `https://www.seodonscrm.co.uk/api/twilio/sms/webhook`
- HTTP Method: `POST`

**Status Callback URL:**
- Enter URL: `https://www.seodonscrm.co.uk/api/twilio/sms/status`
- HTTP Method: `POST`

### Step 4: Save and Repeat

1. Click **Save** at the bottom
2. **Repeat Steps 2-3 for ALL your other phone numbers**
3. Make a note of which phone numbers you've configured

### Step 5: Enable SMS in Database

Run this in Supabase SQL Editor:

```sql
-- Enable SMS for all users with assigned phone numbers
UPDATE user_voip_settings
SET sms_enabled = true
WHERE assigned_phone_number IS NOT NULL;

-- Verify it worked
SELECT u.first_name, u.last_name, v.assigned_phone_number, v.sms_enabled
FROM users u
JOIN user_voip_settings v ON u.id = v.user_id
WHERE v.assigned_phone_number IS NOT NULL;
```

You should see all your SDRs with `sms_enabled = true`.

---

## Part 3: Google Workspace Email Setup (15 minutes)

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Log in with your Google Workspace admin account
3. Select your project (or create new: **Create Project** → Name: "SEO Dons CRM")

### Step 2: Enable Gmail API

1. In the left menu, click **APIs & Services** → **Library**
2. Search for: `Gmail API`
3. Click on **Gmail API**
4. Click **Enable** button
5. Wait for it to enable (about 10 seconds)

### Step 3: Configure OAuth Consent Screen

1. Click **APIs & Services** → **OAuth consent screen** (left sidebar)
2. Select **External** user type
3. Click **Create**

**Fill in App Information:**
- **App name**: `SEO Dons CRM`
- **User support email**: Your email address
- **App logo**: (optional, skip for now)
- **Application home page**: `https://www.seodonscrm.co.uk`
- **Authorized domains**: Click **Add Domain** → Enter: `seodonscrm.co.uk`
- **Developer contact email**: Your email address

4. Click **Save and Continue**

### Step 4: Add Scopes

1. Click **Add or Remove Scopes**
2. **Manually add scopes** (paste these one by one):
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/userinfo.email
   ```
3. Click **Update**
4. Click **Save and Continue**
5. Click **Back to Dashboard**

### Step 5: Create OAuth Credentials

1. Click **APIs & Services** → **Credentials** (left sidebar)
2. Click **+ Create Credentials** (at the top)
3. Select **OAuth client ID**

**Configure the OAuth Client:**
- **Application type**: Select `Web application`
- **Name**: `SEO Dons CRM Web Client`

**Authorized redirect URIs:**
Click **+ Add URI** twice and add both:
1. `http://localhost:3000/api/email/callback` (for local testing)
2. `https://www.seodonscrm.co.uk/api/email/callback` (for production)

4. Click **Create**

### Step 6: Save Your Credentials

A popup will appear with your credentials:

**IMPORTANT: Copy these NOW!**
- **Client ID**: Looks like `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: Looks like `GOCSPX-abc123def456`

Keep these safe - you'll need them in the next step!

### Step 7: Add to Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project: **seo-dons-dashboard**
3. Click **Settings** → **Environment Variables**
4. Add TWO new variables:

**Variable 1:**
- **Key**: `GOOGLE_CLIENT_ID`
- **Value**: Paste your Client ID from Step 6
- **Environments**: Select all (Production, Preview, Development)
- Click **Save**

**Variable 2:**
- **Key**: `GOOGLE_CLIENT_SECRET`
- **Value**: Paste your Client Secret from Step 6
- **Environments**: Select all (Production, Preview, Development)
- Click **Save**

### Step 8: Redeploy Your Application

**Important:** Environment variables only take effect after redeployment!

1. In Vercel, go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Click **Redeploy** again to confirm
5. Wait 2-3 minutes for deployment to complete

---

## Part 4: Verification & Testing (10 minutes)

### Test 1: SMS Receiving

**Send yourself a test SMS:**

1. From your personal mobile phone, send an SMS to one of your Twilio numbers
2. Text message: "Test inbound SMS"
3. Wait 5 seconds
4. Go to: https://www.seodonscrm.co.uk/dashboard/sms
5. **Expected**: You should see a new conversation with your message

**If it doesn't work:**
- Go to Twilio Console → Monitor → Logs → Webhooks
- Look for errors on the `/api/twilio/sms/webhook` endpoint
- Check the error message

### Test 2: SMS Sending

**Reply to your test message:**

1. In the CRM, click on the conversation you just created
2. Type in the message box: "Test outbound SMS"
3. Press Enter or click Send
4. **Expected**:
   - Message appears in the thread with blue background
   - Your mobile phone receives the SMS within 10 seconds

**If it doesn't work:**
- Open browser Developer Tools (F12)
- Go to Network tab
- Try sending again
- Look for `/api/sms/send` request
- Check the response for error messages

### Test 3: Post-Call SMS Modal

**Make a test call:**

1. Go to: https://www.seodonscrm.co.uk/dashboard/leads
2. Click on any lead
3. Click the **Call** button
4. Let the call ring for at least 6 seconds
5. Hang up the call
6. **Expected**: Post-call SMS modal should pop up immediately
7. Try sending a message from the modal

**If modal doesn't appear:**
- Make sure call lasted more than 5 seconds
- Check browser console (F12) for JavaScript errors
- Refresh the page and try again

### Test 4: Connect Gmail Account

**Each SDR needs to do this individually:**

1. Go to: https://www.seodonscrm.co.uk/dashboard/settings
2. Look for "Email Integration" or "Connect Gmail" section
3. Click **Connect Gmail** button
4. **Expected**: Redirected to Google login
5. Select your Google Workspace account
6. Review permissions:
   - Send emails on your behalf
   - Read email messages
   - View email address
7. Click **Allow**
8. **Expected**: Redirected back to settings with "Gmail Connected" message

**If connection fails:**
- Check the URL for error parameters: `?error=...`
- Make sure you added both redirect URIs in Google Cloud Console
- Verify environment variables are set in Vercel
- Check that redeployment completed

### Test 5: Post-Call Email Modal

**Make another test call:**

1. Find a lead that has an email address
2. Call them (or call your own mobile again)
3. Let it ring for 6+ seconds
4. Hang up
5. **Expected**: SMS modal appears first
6. Click **Skip** on SMS modal
7. **Expected**: Email modal appears after 300ms
8. Fill in subject and message
9. Click **Send Email**
10. **Expected**: Success message, and email appears in your Gmail Sent folder

**If email modal doesn't appear:**
- Make sure the contact has an email address in the database
- Check that you completed Test 4 (Gmail connection)
- Check browser console for errors

---

## Part 5: Create Sample Templates (5 minutes)

### SMS Template

Run this in Supabase SQL Editor:

```sql
-- Create a post-call SMS template
INSERT INTO sms_templates (name, content, category, is_active, auto_send_after_call, created_by)
VALUES (
  'Post-Call Follow-up',
  'Hi {first_name}, thanks for speaking with me today! As discussed, here''s a quick summary of the next steps we agreed on. Let me know if you have any questions!',
  'post_call',
  true,
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Create a meeting reminder SMS template
INSERT INTO sms_templates (name, content, category, is_active, auto_send_after_call, created_by)
VALUES (
  'Meeting Reminder',
  'Hi {first_name}, just a reminder about our meeting tomorrow at {time}. Looking forward to speaking with you!',
  'general',
  true,
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

### Email Template

```sql
-- Create a post-call email template
INSERT INTO email_templates (name, subject, content, category, is_active, auto_send_after_call, created_by)
VALUES (
  'Post-Call Follow-up Email',
  'Great speaking with you, {name}',
  'Hi {name},

Thank you for taking the time to speak with me today. I wanted to follow up on our conversation and provide you with the information we discussed.

Key points from our call:
• Point 1 - [Add details]
• Point 2 - [Add details]
• Point 3 - [Add details]

Next steps:
1. [Action item 1]
2. [Action item 2]

Please don''t hesitate to reach out if you have any questions. I''m here to help!

Best regards,
Your SDR Team',
  'post_call',
  true,
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Create a proposal email template
INSERT INTO email_templates (name, subject, content, category, is_active, auto_send_after_call, created_by)
VALUES (
  'Proposal Follow-up',
  'Your custom SEO proposal - {name}',
  'Hi {name},

As promised, I''ve attached our custom proposal for your SEO campaign.

This proposal includes:
✓ Comprehensive SEO audit
✓ Custom keyword strategy
✓ Monthly reporting and analytics
✓ Dedicated account manager

The next step is to schedule a quick 15-minute call to walk through the proposal and answer any questions you might have.

When would be a good time for you this week?

Best regards,
SEO Dons Team',
  'general',
  true,
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

### Test the Templates

1. Make another test call
2. When post-call SMS modal appears, click the **Template dropdown**
3. **Expected**: You should see "Post-Call Follow-up" template
4. Select it - message should auto-fill with template text
5. `{first_name}` should be replaced with the contact's actual name

---

## ✅ Setup Complete Checklist

Go through this checklist to confirm everything is working:

### Database
- [ ] Ran migration 027 successfully
- [ ] Verified sms_messages, sms_templates, email_messages, email_templates tables exist
- [ ] Enabled SMS for all users with phone numbers

### Twilio SMS
- [ ] Configured SMS webhook for phone number 1: _______________
- [ ] Configured SMS webhook for phone number 2: _______________
- [ ] Configured SMS webhook for phone number 3: _______________
- [ ] Tested receiving inbound SMS
- [ ] Tested sending outbound SMS
- [ ] SMS appears in /dashboard/sms page

### Google Email
- [ ] Created/selected Google Cloud project
- [ ] Enabled Gmail API
- [ ] Configured OAuth consent screen
- [ ] Added required scopes
- [ ] Created OAuth credentials (Client ID + Secret)
- [ ] Added GOOGLE_CLIENT_ID to Vercel
- [ ] Added GOOGLE_CLIENT_SECRET to Vercel
- [ ] Redeployed application in Vercel
- [ ] Tested connecting Gmail account
- [ ] Tested sending email

### Post-Call Features
- [ ] Post-call SMS modal appears after calls
- [ ] Post-call Email modal appears after SMS modal (if email available)
- [ ] Templates load in dropdowns
- [ ] Variables ({name}, {first_name}) are replaced correctly
- [ ] Can send SMS from modal
- [ ] Can send Email from modal

### Templates
- [ ] Created at least 2 SMS templates
- [ ] Created at least 2 Email templates
- [ ] Templates appear in post-call modals
- [ ] Variable replacement works

---

## 🆘 Troubleshooting Quick Reference

### "No phone number assigned to your account"

**Fix:**
```sql
-- Replace 'user_xyz' with actual clerk_id
UPDATE user_voip_settings
SET assigned_phone_number = '+447700158258',
    sms_enabled = true
WHERE user_id = (SELECT id FROM users WHERE clerk_id = 'user_xyz');
```

### SMS webhook returns 404

**Fixes:**
1. Verify URL is exactly: `https://www.seodonscrm.co.uk/api/twilio/sms/webhook`
2. Check Vercel deployment is complete
3. Try triggering a new deployment in Vercel

### "Google account not connected"

**Fixes:**
1. Go to Settings and click "Connect Gmail"
2. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
3. Check that you redeployed after adding variables
4. Make sure redirect URI matches exactly in Google Cloud Console

### Post-call modals don't appear

**Fixes:**
1. Call must last more than 5 seconds
2. Refresh browser to clear cache
3. Check browser console (F12) for JavaScript errors
4. Verify latest code is deployed

### Templates don't load

**Fixes:**
1. Check templates have `category = 'post_call'`
2. Check templates have `is_active = true`
3. Run this to verify:
```sql
SELECT * FROM sms_templates WHERE category = 'post_call' AND is_active = true;
SELECT * FROM email_templates WHERE category = 'post_call' AND is_active = true;
```

### Email sending fails with token error

**Fixes:**
1. Disconnect and reconnect Gmail in Settings
2. Tokens auto-refresh, but manual reconnect helps if stuck
3. Check `user_integrations` table has provider='google' entry

---

## 📞 Support Commands

### Check SMS Messages
```sql
SELECT
  sm.created_at,
  u.first_name,
  sm.direction,
  sm.from_number,
  sm.to_number,
  sm.body,
  sm.status
FROM sms_messages sm
JOIN users u ON sm.user_id = u.id
ORDER BY sm.created_at DESC
LIMIT 20;
```

### Check Email Messages
```sql
SELECT
  em.created_at,
  u.first_name,
  em.direction,
  em.to_email,
  em.subject,
  em.status
FROM email_messages em
JOIN users u ON em.user_id = u.id
ORDER BY em.created_at DESC
LIMIT 20;
```

### Check User Integrations
```sql
SELECT
  u.first_name,
  u.last_name,
  ui.provider,
  ui.metadata->>'email' as connected_email,
  ui.token_expiry
FROM users u
JOIN user_integrations ui ON u.id = ui.user_id
WHERE ui.provider = 'google';
```

### Check Phone Assignments
```sql
SELECT
  u.first_name,
  u.last_name,
  u.role,
  v.assigned_phone_number,
  v.sms_enabled
FROM users u
LEFT JOIN user_voip_settings v ON u.id = v.user_id
ORDER BY u.first_name;
```

---

## 🎉 You're Done!

Your SMS and Email system is now fully operational!

**What your team can now do:**
- 📱 Send and receive SMS messages from the CRM
- 📧 Send emails via their Gmail accounts
- 🤖 Automatic follow-up prompts after every call
- 📝 Use templates to save time
- ⏰ Schedule messages for later

**Next Steps:**
1. Train your SDRs on the new features
2. Create more templates based on common scenarios
3. Monitor usage via the support commands above
4. Set up scheduled message processing (future enhancement)

For the full detailed guide, see: [SMS_EMAIL_IMPLEMENTATION_GUIDE.md](SMS_EMAIL_IMPLEMENTATION_GUIDE.md)
