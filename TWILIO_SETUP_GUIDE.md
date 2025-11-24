# 📞 Twilio Calling System Setup Guide

## Overview
This CRM includes a complete calling system with:
- ✅ Outbound calling via Twilio
- ✅ Call recording
- ✅ AI transcription (OpenAI Whisper)
- ✅ Sentiment analysis (GPT-4)
- ✅ Per-SDR phone number assignment
- ✅ Admin UI for phone number management

---

## 🚀 Quick Setup

### Step 1: Twilio Account Setup

1. **Create Twilio Account** (if you don't have one)
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up for a free trial or paid account
   - Verify your email and phone number

2. **Get Your Credentials**
   - Go to Twilio Console → [Dashboard](https://console.twilio.com/)
   - Copy your:
     - **Account SID** (starts with `AC...`)
     - **Auth Token** (click "Show" to reveal)

3. **Configure for UK/Ireland**
   - Your account is pre-configured for Ireland (IE1) region
   - API Base URL: `https://api.ie1.twilio.com`

---

### Step 2: Add Twilio Credentials to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add these variables:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_REGION=ie1
   TWILIO_API_BASE_URL=https://api.ie1.twilio.com
   ```

3. **Redeploy** your application

---

### Step 3: Configure Twilio Webhooks

Twilio needs to know where to send call events. Configure these URLs in Twilio Console:

1. Go to **Twilio Console** → **Phone Numbers** → **Active Numbers**
2. For each purchased number, set:

**Voice Configuration:**
- **A Call Comes In:** `https://www.seodonscrm.co.uk/api/webhooks/twilio/voice`
- **Method:** HTTP POST

**Status Callbacks:**
- **Status Callback URL:** `https://www.seodonscrm.co.uk/api/webhooks/twilio/status`
- **Method:** HTTP POST
- **Events:** All (or at minimum: initiated, ringing, answered, completed)

**Recording Status Callback:**
- Automatically configured when purchasing via the admin UI
- URL: `https://www.seodonscrm.co.uk/api/webhooks/twilio/recording`

---

## 📱 Purchase & Assign Phone Numbers

### Option A: Via Admin UI (Recommended)

1. Log in as **Admin**
2. Go to **Dashboard** → **Admin** → **Phone Numbers**
3. **Search for available numbers:**
   - Leave area code blank for all UK numbers
   - Or enter `20` for London numbers
   - Click "Search Numbers"
4. **Purchase a number:**
   - Click "Purchase" next to desired number
   - Wait for confirmation
5. **Assign to SDR:**
   - Find the SDR in the list
   - Enter the purchased number
   - Click "Assign"

### Option B: Via Twilio Console (Manual)

1. Go to Twilio Console → **Phone Numbers** → **Buy a Number**
2. Search for UK numbers
3. Purchase the number
4. Configure webhooks (see Step 3 above)
5. Manually assign in Supabase:

```sql
INSERT INTO user_voip_settings (user_id, assigned_phone_number, caller_id_number, auto_record, auto_transcribe)
SELECT
  id,
  '+441234567890', -- Your purchased number
  '+441234567890',
  true,
  true
FROM users
WHERE email = 'sdr@example.com'
ON CONFLICT (user_id) DO UPDATE SET
  assigned_phone_number = EXCLUDED.assigned_phone_number,
  caller_id_number = EXCLUDED.caller_id_number;
```

---

## 🧪 Test the System

### 1. Test API Credentials
Visit: `https://www.seodonscrm.co.uk/api/admin/twilio/available-numbers`

Should return JSON with available numbers (admin only).

### 2. Make a Test Call

1. Log in as SDR with assigned phone number
2. Go to any **Lead** or **Customer** page
3. Click the phone icon
4. Call should initiate
5. Check Twilio Console → **Logs** → **Calls** for status

### 3. Verify Recording & Transcription

After a call completes:
1. Go to **Dashboard** → **Calls** → **History**
2. Find your call
3. Should see:
   - ✅ Recording URL
   - ✅ Transcription (if > 10 seconds)
   - ✅ Sentiment analysis
   - ✅ Action items extracted

---

## 💰 Pricing (Twilio UK)

### Phone Numbers
- **Monthly rental:** £1.00/month per number
- **Setup fee:** One-time £1.00

### Calls
- **Outbound to UK:** £0.012/minute
- **Recording:** £0.0005/minute
- **Transcription:** £0.05/minute (via OpenAI Whisper)

### Example: 10 SDRs, 1000 minutes/month
- Phone numbers: £10/month
- Calls: £12/month
- Recording: £0.50/month
- Transcription: £50/month
- **Total: ~£72.50/month**

Compare to JustCall: **£466/month for 10 users** 🎉 **84% savings!**

---

## 🔐 Security Considerations

### Webhook Authentication
Currently, webhook signature validation is **not implemented**. This means anyone with your webhook URL could send fake call events.

**To add signature validation:**
1. Get your Auth Token from Twilio
2. Add to webhook handlers:
```typescript
import { validateRequest } from 'twilio';

const isValid = validateRequest(
  process.env.TWILIO_AUTH_TOKEN!,
  req.headers.get('x-twilio-signature')!,
  webhookUrl,
  params
);

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
}
```

### TCPA Compliance (US)
If calling US numbers:
- ✅ Consent tracking table exists (`consent_records`)
- ⚠️ UI for recording consent not implemented
- ⚠️ DNC (Do Not Call) list integration not implemented

### GDPR Compliance (UK/EU)
- ✅ Call recording disclosure required
- ✅ Data retention policies needed
- ⚠️ Right to deletion not automated

---

## 🐛 Troubleshooting

### "No phone number assigned to user"
**Solution:** Assign a number via Admin UI or run SQL assignment query.

### "Failed to make call: authentication failed"
**Cause:** Wrong TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN
**Solution:** Double-check credentials in Vercel environment variables.

### "Call connects but no recording"
**Cause:** Recording callback URL not configured
**Solution:** Set recording callback in Twilio number configuration.

### "Transcription status stuck on 'pending'"
**Cause:** OpenAI API key missing or webhook not triggered
**Solution:**
1. Check `OPENAI_API_KEY` in Vercel
2. Verify recording webhook is being called (check Vercel logs)

### "Webhook not receiving events"
**Cause:** Wrong URL or firewall blocking Twilio
**Solution:**
1. Verify webhook URLs in Twilio Console
2. Test endpoint: `curl https://www.seodonscrm.co.uk/api/webhooks/twilio/status`
3. Check Vercel function logs

---

## 📊 Monitoring

### Twilio Console
- **Logs** → **Calls**: See all call attempts, success/failure
- **Logs** → **Recordings**: Verify recordings are being captured
- **Monitor** → **Alerts**: Set up alerts for high usage or errors

### Vercel Logs
Filter by:
- `/api/calling/` - Call initiation
- `/api/webhooks/twilio/` - Twilio callbacks
- Look for 📥, ✅, ❌ emojis in logs

### Supabase
Query call records:
```sql
-- Recent calls
SELECT * FROM call_recordings
ORDER BY created_at DESC
LIMIT 20;

-- Failed calls
SELECT * FROM call_recordings
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Transcription status
SELECT
  status,
  transcription_status,
  COUNT(*)
FROM call_recordings
GROUP BY status, transcription_status;
```

---

## 🎯 Next Steps

After setup:
1. ✅ Purchase phone numbers for each SDR
2. ✅ Assign numbers via admin UI
3. ✅ Make test calls
4. ✅ Verify recordings and transcriptions
5. 📈 Monitor usage and costs in Twilio Console
6. 🔐 Consider adding webhook signature validation
7. 📝 Create call scripts for SDRs
8. 📊 Set up call performance dashboards

---

## 🆘 Support

**Twilio Support:**
- Console → Help → Contact Support
- [Twilio Docs](https://www.twilio.com/docs)

**System Logs:**
- Vercel: Dashboard → Logs
- Twilio: Console → Monitor → Logs
- Supabase: Dashboard → Logs

**Environment Check:**
Visit: `https://www.seodonscrm.co.uk/api/webhook/clerk/test`
(Verify all keys are set)

---

## 📝 Admin Checklist

- [ ] Twilio account created
- [ ] Credentials added to Vercel
- [ ] Application redeployed
- [ ] Webhook URLs configured in Twilio
- [ ] At least 1 phone number purchased
- [ ] Phone number assigned to test SDR
- [ ] Test call made successfully
- [ ] Recording captured
- [ ] Transcription completed
- [ ] Sentiment analysis working
- [ ] All SDRs have phone numbers assigned

---

Built with ❤️ using Twilio Voice API
