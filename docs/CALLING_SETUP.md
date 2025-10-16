# Calling System Setup Guide

This guide walks you through setting up the complete calling infrastructure with SignalWire, OpenAI Whisper transcription, and GPT-4 analysis.

## Overview

**Cost Breakdown (10 users):**
- SignalWire: ~$690/month (85% cheaper than JustCall's $4,660/month)
- OpenAI Whisper: $0.006/minute transcription
- OpenAI GPT-4: ~$0.03-0.06 per call analysis
- **Total: ~$700-750/month** vs $4,660/month with JustCall

## Prerequisites

1. **SignalWire Account** (https://signalwire.com)
2. **OpenAI Account** (https://platform.openai.com)
3. **Database migrations applied** (see below)

## Step 1: Apply Database Migrations

Run the calling system migration to create all required tables:

```bash
# Option A: If using Supabase CLI
supabase db push

# Option B: Manual SQL execution
# Go to Supabase Dashboard > SQL Editor
# Copy and run: supabase/migrations/004_calling_system.sql
```

This creates the following tables:
- `call_recordings` - Store call metadata, recordings, transcriptions, AI analysis
- `call_participants` - Track participants in conference calls
- `call_dispositions` - Predefined call outcomes (8 default dispositions)
- `user_voip_settings` - User-specific phone numbers and preferences
- `call_queue` - Power dialer queue management
- `consent_records` - TCPA/GDPR compliance tracking

## Step 2: SignalWire Setup

### 2.1 Create SignalWire Account
1. Go to https://signalwire.com and sign up
2. Create a new project
3. Go to "API" section in your dashboard

### 2.2 Get Credentials
You need three values:
- **Project ID**: Found in "API" > "Project Settings"
- **API Token**: Create in "API" > "API Credentials"
- **Space URL**: Your space subdomain (e.g., `yourcompany.signalwire.com`)

### 2.3 Purchase Phone Numbers
1. Go to "Phone Numbers" in dashboard
2. Click "Buy a Number"
3. Purchase numbers for each user (or shared numbers)
4. **Cost**: ~$1-2 per number/month + $0.0085/minute for calls

### 2.4 Configure Webhooks
1. Go to "Phone Numbers" > Select your number
2. Set "Voice URL" to: `https://yourdomain.com/api/calling/webhook`
3. Set method to POST
4. This enables call status updates and recording notifications

## Step 3: OpenAI Setup

### 3.1 Create API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a name like "CRM Calling System"
4. Copy the key (starts with `sk-`)

### 3.2 Add Credits
1. Go to "Billing" > "Add payment method"
2. Add at least $20 credit to start

### 3.3 Enable Models
Ensure you have access to:
- **whisper-1** (transcription) - $0.006/minute
- **gpt-4-turbo-preview** (analysis) - $0.03 per 1K tokens

## Step 4: Environment Variables

Add these to your `.env.local` file:

```bash
# SignalWire VoIP
SIGNALWIRE_PROJECT_ID=your-project-id-here
SIGNALWIRE_API_TOKEN=your-api-token-here
SIGNALWIRE_SPACE_URL=yourcompany.signalwire.com

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

For local development, use ngrok:
```bash
ngrok http 3000
# Then use the ngrok URL as NEXT_PUBLIC_APP_URL
```

## Step 5: Assign Phone Numbers to Users

Execute this SQL in Supabase to assign numbers:

```sql
-- Example: Assign phone number to a user
INSERT INTO user_voip_settings (
  user_id,
  assigned_phone_number,
  caller_id_number,
  auto_record,
  auto_transcribe
)
VALUES (
  'user-uuid-here',
  '+15551234567',  -- Number from SignalWire
  '+15551234567',  -- Same as assigned or company main number
  true,            -- Record all calls
  true             -- Auto-transcribe with Whisper
)
ON CONFLICT (user_id) DO UPDATE SET
  assigned_phone_number = EXCLUDED.assigned_phone_number,
  caller_id_number = EXCLUDED.caller_id_number;
```

## Step 6: Test the System

### 6.1 Test Click-to-Call
1. Navigate to a customer detail page
2. Click the phone icon next to customer's phone number
3. Call should initiate through SignalWire
4. Check database for new `call_recordings` entry

### 6.2 Test Recording & Transcription
1. Make a test call
2. Speak for at least 30 seconds
3. End the call
4. Within 1-2 minutes, check `call_recordings` table:
   - `recording_url` should be populated
   - `transcription` should contain Whisper output
   - `ai_summary` should contain GPT-4 analysis
   - `sentiment_score` and `sentiment_label` should be set

### 6.3 Verify Webhook Reception
Check your application logs for webhook POST requests:
```bash
POST /api/calling/webhook
CallSid=CA123..., CallStatus=completed, CallDuration=45
```

## Features Overview

### Click-to-Call
- One-click calling from customer/deal pages
- Automatically logs calls to database
- Associates calls with deals and customers

### Call Recording
- Automatic recording of all outbound calls
- Configurable per-user via `user_voip_settings.auto_record`
- Recordings stored in SignalWire, URL saved in database

### AI Transcription (Whisper)
- Automatic transcription after call ends
- 95%+ accuracy in English
- Word-level timestamps available
- **Cost**: $0.006/minute (5-min call = $0.03)

### AI Analysis (GPT-4)
Automatically extracts from transcription:
- **Sentiment**: Score (-1.0 to 1.0) and label (positive/neutral/negative)
- **Key Topics**: Up to 5 main discussion points
- **Action Items**: Extracted follow-up tasks
- **Summary**: 2-3 sentence call summary
- **Cost**: ~$0.03-0.06 per call

### Call History Dashboard
- View all calls with filters
- Search by customer, deal, date
- Play recordings
- Read transcriptions
- Review AI analysis

### TCPA/GDPR Compliance
- Track consent records per customer
- Four consent types: TCPA Call, TCPA SMS, GDPR Processing, GDPR Marketing
- Record consent method, date, IP address, and recording URL
- Monitor customers without consent
- Honor revocation immediately

### Power Dialer (Coming Soon)
- Queue up multiple calls
- Auto-dial next number after disposition
- Track attempts and outcomes
- Respect time zones and DNC lists

## Troubleshooting

### Calls Not Connecting
1. **Check SignalWire balance**: Go to dashboard > Billing
2. **Verify phone number**: Ensure number is active and not suspended
3. **Check user settings**: Verify `user_voip_settings` has `assigned_phone_number`
4. **Test manually**: Try making a call directly through SignalWire dashboard

### Transcriptions Not Working
1. **Check OpenAI balance**: Go to platform.openai.com > Billing
2. **Verify API key**: Test with: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. **Check recording URL**: Ensure `recording_url` is accessible
4. **Review logs**: Check Next.js console for errors in `/api/calling/transcribe`

### Webhooks Not Received
1. **Verify public URL**: Ensure NEXT_PUBLIC_APP_URL is accessible from internet
2. **Use ngrok for local dev**: `ngrok http 3000`
3. **Check SignalWire config**: Verify webhook URL in phone number settings
4. **Test webhook**: Use SignalWire's "Test" button in webhook configuration

### AI Analysis Not Populating
1. **Check transcription**: Ensure transcription completed first
2. **Verify GPT-4 access**: Some accounts need to request GPT-4 access
3. **Review prompt**: Check `/api/calling/analyze` for prompt issues
4. **Check token limits**: Ensure transcription isn't too long (max 8K tokens for GPT-4)

## Cost Optimization Tips

### Reduce Transcription Costs
- Only transcribe calls longer than 60 seconds
- Set `auto_transcribe = false` for specific users
- Batch process during off-peak hours

### Reduce Analysis Costs
- Use GPT-3.5-turbo instead of GPT-4 (~90% cheaper)
- Only analyze important calls (deals > $10K)
- Cache analysis results to avoid re-processing

### Reduce Call Costs
- Use local numbers to avoid long-distance fees
- Negotiate volume discounts with SignalWire
- Monitor usage with monthly spending alerts

## Advanced Features

### Conference Calling
Enable 3-way calls for manager coaching:
```javascript
// Use call_participants table to track multiple participants
// SignalWire supports adding participants to active calls
```

### Call Queuing & Power Dialer
```sql
-- Add numbers to queue
INSERT INTO call_queue (user_id, customer_id, phone_number, priority)
VALUES ('user-uuid', 'customer-uuid', '+15555551234', 8);

-- Fetch next number to call
SELECT * FROM call_queue
WHERE user_id = 'user-uuid' AND status = 'queued'
ORDER BY priority DESC, scheduled_for ASC
LIMIT 1;
```

### Custom Dispositions
```sql
-- Add your own call outcomes
INSERT INTO call_dispositions (name, category, description, sort_order)
VALUES ('Gatekeeper Block', 'not_connected', 'Could not reach decision maker', 10);
```

## Production Checklist

- [ ] SignalWire account created with active phone numbers
- [ ] OpenAI API key created with credits
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Webhook URL configured in SignalWire (must be HTTPS)
- [ ] Phone numbers assigned to all users
- [ ] Test calls completed successfully
- [ ] Transcription working
- [ ] AI analysis populating
- [ ] TCPA/GDPR consent collection implemented
- [ ] Call recording disclaimer enabled
- [ ] Do Not Call (DNC) list integration

## Support Resources

- **SignalWire Docs**: https://developer.signalwire.com
- **OpenAI API Docs**: https://platform.openai.com/docs
- **TCPA Compliance**: https://www.fcc.gov/tcpa
- **GDPR Guide**: https://gdpr.eu

## Next Steps

After calling system is working:
1. **Phase 5**: Implement LinkedIn posting scheduler
2. **Phase 6**: Add email/SMS automation
3. **Phase 7**: Build lead enrichment and calendar booking

---

**Estimated Setup Time**: 2-3 hours
**Monthly Cost**: $700-750 for 10 users
**Cost Savings vs JustCall**: 85% ($3,900/month)
