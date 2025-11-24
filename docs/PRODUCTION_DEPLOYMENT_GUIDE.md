# Production Deployment Guide - SEO Dons CRM

**Complete setup checklist for deploying the CRM to production with all Phase 4-6 features enabled.**

---

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] Supabase project created (https://supabase.com)
- [ ] Clerk account for authentication (https://clerk.com)
- [ ] SignalWire account for calling (https://signalwire.com)
- [ ] OpenAI API key (https://platform.openai.com)
- [ ] LinkedIn Developer App (https://www.linkedin.com/developers)
- [ ] Domain name configured
- [ ] Credit card for service billing

**Estimated Setup Time**: 4-6 hours
**Monthly Cost**: $700-750 for 10 users

---

## Step 1: Database Setup (30 minutes)

### 1.1 Apply Migrations in Supabase

Go to your Supabase Dashboard → SQL Editor → New Query

**Run migrations in order:**

1. **Base Schema** (if not already applied):
```sql
-- Your existing schema
```

2. **Calling System** (`004_calling_system.sql`):
   - Open the file and copy all contents
   - Paste into SQL Editor
   - Click "Run"
   - Verify 8 tables created: call_recordings, call_participants, call_dispositions, user_voip_settings, call_queue, consent_records

3. **LinkedIn Integration** (`005_linkedin_integration.sql`):
   - Open the file and copy all contents
   - Paste into SQL Editor
   - Click "Run"
   - Verify 6 tables created: linkedin_connections, social_posts, post_templates, post_analytics, posting_schedule, social_selling_metrics

### 1.2 Verify Table Creation

Run this query to check all tables exist:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables (20+ total):
- achievements
- activities
- appointments
- call_dispositions
- call_participants
- call_queue
- call_recordings
- commissions
- consent_records
- customers
- deals
- linkedin_connections
- post_analytics
- post_templates
- posting_schedule
- social_posts
- social_selling_metrics
- streaks
- user_achievements
- user_voip_settings
- users

### 1.3 Configure Row Level Security (Production Only)

For production, enable RLS on new tables:

```sql
-- Enable RLS on calling tables
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on LinkedIn tables
ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for each table (example for call_recordings)
CREATE POLICY "Users can view their own calls"
  ON call_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calls"
  ON call_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Repeat for other tables...
```

---

## Step 2: SignalWire Setup (45 minutes)

### 2.1 Create SignalWire Account

1. Go to https://signalwire.com/signup
2. Choose "Voice & Video" plan
3. Complete account creation
4. Add payment method (no charge until usage)

### 2.2 Get API Credentials

1. In SignalWire Dashboard, go to **Settings** → **API**
2. Note these three values:
   - **Project ID**: Found at top of dashboard
   - **API Token**: Click "Create Token" if none exists
   - **Space URL**: Your subdomain (e.g., `yourcompany.signalwire.com`)

### 2.3 Purchase Phone Numbers

1. Go to **Phone Numbers** → **Buy a Number**
2. Search by area code or location
3. Purchase numbers for each user (or shared pool)
4. **Cost**: ~$1.50/number/month

**Recommended**: Start with 3-5 shared numbers and add more as needed.

### 2.4 Configure Webhooks

For EACH phone number:

1. Click the number → **Settings**
2. Under "Voice", set **Voice URL** to:
   ```
   https://yourdomain.com/api/calling/webhook
   ```
3. Set method to **POST**
4. Set **Status Callback URL** to same URL
5. Enable **Call Status Events**: All (initiated, ringing, answered, completed)
6. Save changes

⚠️ **Important**: Webhook URLs must use HTTPS (not HTTP). Use ngrok for local testing.

### 2.5 Assign Phone Numbers to Users

In Supabase SQL Editor:

```sql
-- Replace with your actual user UUIDs and phone numbers
INSERT INTO user_voip_settings (
  user_id,
  assigned_phone_number,
  caller_id_number,
  auto_record,
  auto_transcribe,
  tcpa_consent_recorded,
  gdpr_consent_recorded
)
VALUES
  -- Example for user 1
  (
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user UUID
    '+15551234567',  -- SignalWire number purchased
    '+15551234567',  -- Same as assigned, or company main number
    true,            -- Record all calls
    true,            -- Auto-transcribe with Whisper
    true,            -- TCPA consent obtained
    true             -- GDPR consent obtained
  ),
  -- Add more users...
  (
    '00000000-0000-0000-0000-000000000002',
    '+15551234568',
    '+15551234568',
    true,
    true,
    true,
    true
  );
```

**To get user UUIDs**:
```sql
SELECT id, clerk_id, email, first_name, last_name
FROM users
ORDER BY created_at;
```

---

## Step 3: OpenAI Setup (15 minutes)

### 3.1 Create API Key

1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Name it "CRM Calling System"
4. Copy the key (starts with `sk-`)
5. ⚠️ Save it securely - you can't view it again

### 3.2 Add Billing

1. Go to **Settings** → **Billing**
2. Click **Add payment method**
3. Add credit card
4. Set spending limit (recommended: $100/month initially)
5. Add at least $20 credit to start

### 3.3 Verify Model Access

Ensure you have access to:
- ✅ **whisper-1** (transcription) - Included in all accounts
- ✅ **gpt-4-turbo-preview** (analysis) - May require usage history

If you see "Model not available" errors:
1. Use GPT-3.5-turbo instead (much cheaper)
2. Or request GPT-4 access via OpenAI support

---

## Step 4: LinkedIn App Setup (30 minutes)

### 4.1 Create LinkedIn App

1. Go to https://www.linkedin.com/developers/apps
2. Click **Create app**
3. Fill in details:
   - **App name**: SEO Dons CRM
   - **LinkedIn Page**: Your company page
   - **App logo**: Upload company logo
   - **Legal agreement**: Accept terms
4. Click **Create app**

### 4.2 Configure OAuth

1. In your app, go to **Auth** tab
2. Under **Redirect URLs**, add:
   ```
   https://yourdomain.com/api/linkedin/callback
   ```
   And for local testing:
   ```
   http://localhost:3000/api/linkedin/callback
   ```
3. Save changes

### 4.3 Get Credentials

1. Still in **Auth** tab, note:
   - **Client ID**: Long alphanumeric string
   - **Client Secret**: Click "Show" to reveal
2. Copy both values

### 4.4 Request Permissions

1. Go to **Products** tab
2. Request access to **Sign In with LinkedIn**
3. Request access to **Share on LinkedIn** (if available)
4. Fill out use case description
5. Wait for approval (usually instant for Sign In)

⚠️ **Note**: Full posting capabilities may require LinkedIn review.

---

## Step 5: Environment Variables (15 minutes)

### 5.1 Update .env.local

Copy `.env.local.example` to `.env.local` and fill in ALL values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# SignalWire VoIP
SIGNALWIRE_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SIGNALWIRE_API_TOKEN=PTxxxxxxxxxxxxxxxxxxxxxxxxxx
SIGNALWIRE_SPACE_URL=yourcompany.signalwire.com

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxx

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=xxxxxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/linkedin/callback

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 5.2 Verify All Variables Set

Run this check script:

```bash
# In your terminal
node -e "
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'SIGNALWIRE_PROJECT_ID',
  'SIGNALWIRE_API_TOKEN',
  'SIGNALWIRE_SPACE_URL',
  'OPENAI_API_KEY',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

require('dotenv').config({ path: '.env.local' });

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.log('❌ Missing environment variables:');
  missing.forEach(key => console.log('  -', key));
  process.exit(1);
} else {
  console.log('✅ All environment variables set!');
}
"
```

---

## Step 6: Build and Deploy (30 minutes)

### 6.1 Test Locally

```bash
# Install dependencies
npm install

# Build to check for errors
npm run build

# Start dev server
npm run dev
```

Visit http://localhost:3000 and test:
- ✅ Login works
- ✅ Dashboard loads
- ✅ All pages compile
- ✅ No console errors (except Clerk headers warnings)

### 6.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Connect GitHub repo
2. Import project
3. Add environment variables (all from .env.local)
4. Deploy

### 6.3 Configure Custom Domain

1. In Vercel → Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Wait for SSL certificate (5-10 minutes)

### 6.4 Update Webhook URLs

Now that you have a production URL, update:

1. **SignalWire**: Phone number settings → Voice URL:
   ```
   https://yourdomain.com/api/calling/webhook
   ```

2. **LinkedIn**: App Auth settings → Redirect URLs:
   ```
   https://yourdomain.com/api/linkedin/callback
   ```

3. **Environment Variables** in Vercel:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/linkedin/callback
   ```

---

## Step 7: Testing (45 minutes)

### 7.1 Test Click-to-Call

1. Login to CRM
2. Go to Customers or Deals
3. Click phone icon next to a phone number
4. Verify:
   - ✅ Call initiated
   - ✅ Phone rings
   - ✅ Can connect
   - ✅ Call appears in Call History
   - ✅ Recording saved (if enabled)

### 7.2 Test Transcription

1. Make a test call
2. Speak for 30+ seconds
3. End call
4. Wait 2-3 minutes
5. Go to Call History → View call details
6. Verify:
   - ✅ Transcription appears
   - ✅ Sentiment score shown
   - ✅ AI summary generated
   - ✅ Key topics listed
   - ✅ Action items extracted

### 7.3 Test LinkedIn Connection

1. Go to Social Media page
2. Click "Connect LinkedIn"
3. Authorize in LinkedIn popup
4. Verify:
   - ✅ Connection successful message
   - ✅ Profile info displayed
   - ✅ "New Post" button appears

### 7.4 Test Compliance Tracking

1. Go to Compliance page
2. Verify:
   - ✅ Stats cards show counts
   - ✅ Customers without consent listed
   - ✅ Recent consent records display

---

## Step 8: User Onboarding (30 minutes)

### 8.1 Create User Accounts

In Clerk Dashboard:
1. Go to Users → Create User
2. Add email, name, password
3. Repeat for each team member

Or send invite links:
1. Go to Invitations → Create Invitation
2. Send email invites
3. Users sign up via link

### 8.2 Assign Roles

In Supabase:
```sql
UPDATE users
SET role = 'manager'  -- or 'bdr', 'admin'
WHERE email = 'manager@example.com';
```

### 8.3 Assign Phone Numbers

For each user, insert VoIP settings:
```sql
INSERT INTO user_voip_settings (user_id, assigned_phone_number, auto_record, auto_transcribe)
SELECT id, '+15551234567', true, true
FROM users
WHERE email = 'user@example.com';
```

### 8.4 Train Users

Provide training on:
- Click-to-call functionality
- Call history review
- LinkedIn posting
- Compliance requirements

---

## Monitoring and Maintenance

### Daily Checks

- [ ] Monitor SignalWire usage (Dashboard → Usage)
- [ ] Check OpenAI API usage (Platform → Usage)
- [ ] Review call quality scores
- [ ] Check for failed transcriptions

### Weekly Checks

- [ ] Review compliance stats
- [ ] Check LinkedIn post performance
- [ ] Analyze call metrics
- [ ] Review error logs in Vercel

### Monthly Tasks

- [ ] Review and optimize costs
- [ ] Update phone number assignments
- [ ] Audit consent records
- [ ] Review and update battle cards

---

## Troubleshooting

### Calls Not Connecting

1. Check SignalWire balance
2. Verify webhook URL is HTTPS
3. Check user_voip_settings has phone assigned
4. Review call_recordings table for error messages

### Transcriptions Not Working

1. Verify OPENAI_API_KEY is set
2. Check OpenAI billing has credits
3. Review API usage limits
4. Check recording_url is accessible

### LinkedIn Not Connecting

1. Verify redirect URI matches exactly
2. Check client ID and secret
3. Ensure app approved by LinkedIn
4. Review OAuth scopes requested

### Database Errors

1. Check RLS policies allow access
2. Verify migrations applied
3. Review Supabase logs
4. Check foreign key constraints

---

## Cost Monitoring

**Expected monthly costs for 10 users:**

| Service | Cost | Notes |
|---------|------|-------|
| SignalWire | $690 | 200K minutes @ $0.00345/min |
| OpenAI Whisper | $120 | 20K minutes @ $0.006/min |
| OpenAI GPT-4 | $180 | 3K calls @ $0.06/call |
| Supabase Pro | $25 | Database + storage |
| Vercel Pro | $20 | Hosting |
| LinkedIn API | $0 | Free tier |
| **Total** | **$1,035** | vs $4,660 with JustCall |

**Savings: $3,625/month (78%)**

---

## Support Resources

- **SignalWire Docs**: https://developer.signalwire.com
- **OpenAI API**: https://platform.openai.com/docs
- **LinkedIn API**: https://learn.microsoft.com/en-us/linkedin/
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

## Next Steps After Deployment

1. **Phase 7**: Email/SMS Automation
   - SendGrid integration
   - Automated sequences
   - Reply detection

2. **Phase 8**: Advanced Features
   - Power dialer
   - Conference calling
   - Screen recording
   - Advanced analytics

---

**Deployment Checklist Summary**

- [ ] Database migrations applied
- [ ] SignalWire account configured
- [ ] OpenAI API key created
- [ ] LinkedIn app created
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Webhooks configured
- [ ] Test calls successful
- [ ] Transcriptions working
- [ ] LinkedIn connected
- [ ] Users onboarded
- [ ] Monitoring setup

**Status**: Ready for production use! 🚀
