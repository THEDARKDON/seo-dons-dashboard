# ✅ Auto-Send Issue FIXED

## What Was Wrong

The auto-send system wasn't working because of a **database column name mismatch**:

**[app/api/calling/auto-send/route.ts:113](app/api/calling/auto-send/route.ts#L113)**
```typescript
// BEFORE (WRONG):
.select('phone_number')  // ❌ This column doesn't exist

// AFTER (FIXED):
.select('assigned_phone_number')  // ✅ Correct column name
```

The database table `user_voip_settings` has a column called `assigned_phone_number`, not `phone_number`. The auto-send endpoint was querying the wrong column, so it never found the user's Twilio phone number, and couldn't send SMS messages.

## What I Fixed

### 1. Fixed Auto-Send Endpoint
- **File:** [app/api/calling/auto-send/route.ts](app/api/calling/auto-send/route.ts#L113)
- **Change:** `phone_number` → `assigned_phone_number`
- **Impact:** Auto-send will now correctly find the user's Twilio number

### 2. Updated Debug Script
- **File:** [DEBUG_AUTO_SEND.sql](DEBUG_AUTO_SEND.sql)
- **Change:** Fixed column name in CHECK 5
- **Impact:** Debug script will now show correct Twilio number

### 3. Created Complete Fix Guide
- **File:** [AUTO_SEND_FIX.md](AUTO_SEND_FIX.md)
- **Contents:**
  - How auto-send works (complete flow)
  - Required configuration (SMS + Email)
  - Environment variables needed
  - Troubleshooting steps
  - Testing checklist

## What You Need To Do Now

### Step 1: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

The code fix is already committed and pushed to GitHub.

### Step 2: Run Debug Script

Copy and paste **[DEBUG_AUTO_SEND.sql](DEBUG_AUTO_SEND.sql)** into Supabase SQL Editor and run it.

This will check:
- ✅ Do templates exist?
- ✅ Do recent calls exist?
- ✅ Are messages being created?
- ✅ Does the lead have phone + email?
- ✅ Does the user have a Twilio number assigned?
- ✅ Does the user have Gmail connected?

**Expected Output:**
```
✓ Has Twilio number: +441474554816
✓ Gmail connected
```

If you see `✗ NO Twilio number configured` or `✗ Gmail NOT connected`, those need to be set up first.

### Step 3: Test Auto-Send

1. Make a test call to a lead that has:
   - ✅ Phone number (e.g., +447700900123)
   - ✅ Email address (e.g., test@example.com)

2. **After the call ends**, check the console logs:
   ```
   ✅ SMS sent: SMxxxxxxxxxxxxxxx
   Auto-send triggered: 1 SMS, 1 Email
   ```

3. Check the database:
   ```sql
   -- Should show new messages
   SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM email_messages ORDER BY created_at DESC LIMIT 5;
   ```

## Required Setup (If Not Already Done)

### For SMS to Work:
- ✅ User needs `assigned_phone_number` in `user_voip_settings`
- ✅ Environment variables:
  ```env
  TWILIO_ACCOUNT_SID=AC78b94a2ab848d0ae177f8069688f39ff
  TWILIO_AUTH_TOKEN=your_auth_token
  NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
  ```

### For Email to Work:
- ✅ User needs Gmail connected (via OAuth in Settings → Integrations)
- ✅ Environment variables:
  ```env
  GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
  ```

### Check Your User Settings:

Run this in Supabase SQL Editor:
```sql
-- Check your Twilio number
SELECT
    u.first_name,
    u.last_name,
    vs.assigned_phone_number as twilio_number,
    ui.metadata->>'email' as gmail_email
FROM users u
LEFT JOIN user_voip_settings vs ON u.id = vs.user_id
LEFT JOIN user_integrations ui ON u.id = ui.user_id AND ui.provider = 'google'
WHERE u.role = 'admin';
```

**Expected Output:**
```
first_name | last_name | twilio_number    | gmail_email
-----------|-----------|------------------|------------------
John       | Doe       | +441474554816    | john@example.com
```

If `twilio_number` is NULL, you need to assign a phone number.
If `gmail_email` is NULL, you need to connect Gmail.

## How Auto-Send Works Now

### Complete Flow:

1. **Call ends** → SignalWire sends webhook to `/api/calling/webhook`

2. **Webhook handler** checks if status is `completed`, `no-answer`, `busy`, or `failed`
   - If yes → calls `/api/calling/auto-send`

3. **Auto-Send Endpoint:**
   - Gets call details from database
   - Finds lead/customer contact info (phone + email)
   - Queries templates where `auto_send_after_call = true` and `category = 'post_call'`
   - Replaces variables: `{first_name}`, `{last_name}`, `{name}`, `{company}`
   - Gets user's Twilio number from `assigned_phone_number` ✅ (FIXED!)
   - Gets user's Gmail email from `user_integrations`
   - Creates SMS message with `status = 'queued'`
   - Creates Email message with `status = 'queued'`
   - If `auto_send_delay_minutes = 0` → sends immediately
   - If `auto_send_delay_minutes > 0` → schedules for later

4. **SMS Send:** Calls Twilio API via [/api/sms/send](app/api/sms/send/route.ts)

5. **Email Send:** Calls Gmail API via [/api/email/send](app/api/email/send/route.ts)

### Default Templates (Created by HOTFIX_NOW.sql):

#### SMS:
1. **Successful Call Follow-up** (delay: 0 min)
   - "Hi {first_name}, thank you for speaking with SEO Dons today! We're excited to help grow your business. Visit: https://www.seodons.com"

2. **Missed Call Follow-up** (delay: 0 min)
   - "Hi {first_name}, we tried to reach you at SEO Dons. Please call us back at your convenience. Looking forward to speaking with you!"

#### Email:
1. **Successful Call Follow-up Email** (delay: 5 min)
   - Subject: "Great speaking with you, {first_name}!"
   - Body: HTML with link to seodons.com

2. **Missed Call Follow-up Email** (delay: 5 min)
   - Subject: "We tried to reach you, {first_name}"
   - Body: HTML asking to call back

## Troubleshooting

### Problem: "No Twilio phone number for user"

**Solution:**
```sql
-- Assign phone number to user
UPDATE user_voip_settings
SET assigned_phone_number = '+441474554816'
WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com');
```

### Problem: "No Gmail connected for user"

**Solution:** Go to Settings → Integrations → Connect Gmail

### Problem: "No contact info available"

**Solution:** Make sure the lead has both phone_number and email:
```sql
-- Check lead contact info
SELECT first_name, last_name, phone_number, email
FROM leads
WHERE id = 'lead_id_here';

-- Update lead contact info
UPDATE leads
SET
    phone_number = '+447700900123',
    email = 'lead@example.com'
WHERE id = 'lead_id_here';
```

### Problem: Messages created but not sent

**Check database:**
```sql
SELECT * FROM sms_messages WHERE status = 'failed';
SELECT * FROM email_messages WHERE status = 'failed';
```

Look at `error_message` column for details.

## Git Commits

✅ **Commit:** [8baf105](https://github.com/THEDARKDON/seo-dons-dashboard/commit/8baf105)
- Fixed auto-send column name mismatch
- Created debug script
- Created complete fix guide

✅ **Pushed to:** `main` branch

## Files Changed

1. [app/api/calling/auto-send/route.ts](app/api/calling/auto-send/route.ts) - Fixed column name
2. [DEBUG_AUTO_SEND.sql](DEBUG_AUTO_SEND.sql) - Diagnostic script
3. [AUTO_SEND_FIX.md](AUTO_SEND_FIX.md) - Complete troubleshooting guide

## Next Steps

1. ✅ Restart dev server
2. ✅ Run DEBUG_AUTO_SEND.sql
3. ✅ Verify Twilio number is assigned
4. ✅ Verify Gmail is connected
5. ✅ Make test call
6. ✅ Verify messages are sent

Once working:
- Customize templates in Auto-Send page
- Adjust delays per template
- Create additional templates for different scenarios
- Monitor delivery rates
