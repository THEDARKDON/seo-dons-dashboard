# Auto-Send Fix - Complete Guide

## Problem Identified

Auto-send wasn't working due to a **database column name mismatch**:
- The auto-send endpoint was querying `user_voip_settings.phone_number` (doesn't exist)
- The actual column name is `user_voip_settings.assigned_phone_number`

This has been **FIXED** in [app/api/calling/auto-send/route.ts:113](app/api/calling/auto-send/route.ts#L113)

## Steps to Fix Auto-Send

### 1. Restart Your Development Server

The code fix is already applied. Restart your dev server to pick up the changes:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Verify Database Configuration

Run the `DEBUG_AUTO_SEND.sql` file in Supabase SQL Editor to check your setup.

This will verify:
- ✅ Auto-send templates exist
- ✅ Leads have phone/email
- ✅ User has Twilio number assigned
- ✅ User has Gmail connected
- ✅ Recent calls exist

### 3. Test Auto-Send

Make a test call to a lead that has:
- ✅ Phone number (for SMS)
- ✅ Email address (for Email)

**After the call completes:**
1. Check the console logs for auto-send messages
2. Query the database to verify messages were created:

```sql
-- Check recent SMS messages
SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT 5;

-- Check recent Email messages
SELECT * FROM email_messages ORDER BY created_at DESC LIMIT 5;
```

## How Auto-Send Works

### Flow:
1. **Call completes** → webhook receives status
2. **Webhook calls** `/api/calling/auto-send` (if status is completed/no-answer/busy/failed)
3. **Auto-send endpoint:**
   - Queries templates where `auto_send_after_call = true`
   - Gets contact info from lead/customer
   - Replaces variables (`{first_name}`, `{name}`, `{company}`)
   - Creates SMS/Email messages with `status='queued'`
   - If `auto_send_delay_minutes = 0`, sends immediately

### Required Configuration:

#### For SMS Auto-Send:
- ✅ Lead must have `phone_number`
- ✅ User must have `assigned_phone_number` in `user_voip_settings`
- ✅ SMS template with `auto_send_after_call = true` and `category = 'post_call'`
- ✅ `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` environment variables

#### For Email Auto-Send:
- ✅ Lead must have `email`
- ✅ User must have Gmail connected in `user_integrations`
- ✅ Email template with `auto_send_after_call = true` and `category = 'post_call'`
- ✅ `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables

### Important Environment Variables:

```env
# Required for webhook to call auto-send endpoint
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Required for Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Required for Gmail
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Required for database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### No messages sent after call:

1. **Check console logs** for errors like:
   - "No Twilio phone number for user"
   - "No Gmail connected for user"
   - "No contact info available"

2. **Run DEBUG_AUTO_SEND.sql** to identify missing data

3. **Verify webhook is calling auto-send:**
   - Check webhook logs: `/api/calling/webhook`
   - Ensure `NEXT_PUBLIC_APP_URL` is set correctly

4. **Check database for queued messages:**
   ```sql
   SELECT * FROM sms_messages WHERE status = 'queued';
   SELECT * FROM email_messages WHERE status = 'queued';
   ```

### Messages created but not sent:

- Check Twilio credentials are correct
- Check Gmail OAuth is properly configured
- Check for errors in `sms_messages.error_message` or `email_messages.error_message`

### Templates not found:

Run `HOTFIX_NOW.sql` again to create default templates.

## Default Templates Created by HOTFIX

### SMS Templates:
1. **Successful Call Follow-up**
   - Body: "Hi {first_name}, thank you for speaking with SEO Dons today! We're excited to help grow your business. Visit: https://www.seodons.com"
   - Delay: 0 minutes (sends immediately)

2. **Missed Call Follow-up**
   - Body: "Hi {first_name}, we tried to reach you at SEO Dons. Please call us back at your convenience. Looking forward to speaking with you!"
   - Delay: 0 minutes (sends immediately)

### Email Templates:
1. **Successful Call Follow-up Email**
   - Subject: "Great speaking with you, {first_name}!"
   - Body: HTML email with link to seodons.com
   - Delay: 5 minutes (default for emails)

2. **Missed Call Follow-up Email**
   - Subject: "We tried to reach you, {first_name}"
   - Body: HTML email asking to call back or reply

## Testing Checklist

- [ ] Development server restarted
- [ ] `DEBUG_AUTO_SEND.sql` run successfully
- [ ] Templates exist in database (2 SMS + 2 Email)
- [ ] User has `assigned_phone_number` in `user_voip_settings`
- [ ] User has Gmail connected in `user_integrations`
- [ ] Test lead has both `phone_number` and `email`
- [ ] `NEXT_PUBLIC_APP_URL` environment variable is set
- [ ] Made test call to lead
- [ ] Messages created in database
- [ ] Messages actually sent (check Twilio logs + Gmail)

## Next Steps

Once auto-send is working:
1. Customize templates in the Auto-Send settings page
2. Adjust `auto_send_delay_minutes` per template
3. Create additional templates for different scenarios
4. Monitor message delivery rates
5. Set up scheduled message queue worker for delayed sends
