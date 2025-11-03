# Instantly.ai Integration Setup Guide

## Overview
Track email opens, clicks, and replies from Instantly.ai campaigns directly in your CRM.

## Step 1: Run Migration 037

Run this in your Supabase SQL Editor:

```sql
-- Add Instantly tracking fields to leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS instantly_campaign_id TEXT,
ADD COLUMN IF NOT EXISTS instantly_lead_id TEXT,
ADD COLUMN IF NOT EXISTS email_opened BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_replied BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instantly_status TEXT;

-- Create tracking events table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  email_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  event_type TEXT CHECK (event_type IN ('opened', 'clicked', 'replied', 'bounced', 'unsubscribed')) NOT NULL,
  instantly_campaign_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  clicked_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email_opened ON leads(email_opened);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_lead_id ON email_tracking_events(lead_id);

ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert tracking events"
  ON email_tracking_events FOR INSERT
  WITH CHECK (true);
```

## Step 2: Configure Instantly.ai Webhook

1. Log in to your Instantly.ai account
2. Go to **Settings** → **Integrations** → **Webhooks**
3. Add new webhook:
   - **URL**: `https://www.seodonscrm.co.uk/api/webhooks/instantly`
   - **Events** (select all):
     - `email.opened`
     - `email.clicked`
     - `email.replied`
     - `email.bounced`
     - `lead.unsubscribed`
   - **Method**: POST
   - **Active**: Yes

## Step 3: Export and Import Leads

### Option A: Export from Instantly
1. In Instantly.ai, go to your campaign
2. Export leads as CSV
3. Make sure CSV includes columns:
   - `email` (required)
   - `first_name`, `last_name` (optional now!)
   - `company`
   - `campaign_id` (for tracking)
   - `lead_id` (for tracking)

### Option B: Add Campaign ID Manually
If your CSV doesn't have campaign_id, you can add it during import or update leads later.

## Step 4: Import to CRM

1. Go to `/dashboard/admin/leads` (Admin only)
2. Click **Import Leads**
3. Select your Instantly CSV
4. Assign to SDR
5. Import

The system will automatically:
- Map Instantly campaign_id and lead_id
- Set up tracking for email engagement
- Link leads to Instantly campaigns

## Step 5: Monitor Engagement

Visit `/dashboard/leads/email-engagement` to see:

- **📊 Dashboard Stats**:
  - Total leads
  - Open rate (%)
  - Click-through rate (%)
  - Reply count (hot leads!)
  - Bounced emails

- **🔥 Hot Leads**: Automatically identified when they reply
- **📈 Engagement Timeline**: See when leads opened emails
- **🎯 Filtering**: Click stats to filter by engagement type

## How It Works

1. **Lead Opens Email** → Instantly webhook fires → CRM updates `email_opened = true`
2. **Lead Clicks Link** → Webhook fires → CRM updates `email_clicked = true`
3. **Lead Replies** → Webhook fires → CRM marks as "HOT LEAD"
4. **Email Bounces** → Webhook fires → CRM updates `email_bounced = true`

## Webhook Payload Examples

### Email Opened
```json
{
  "event": "email.opened",
  "lead_email": "john@company.com",
  "campaign_id": "camp_123",
  "lead_id": "lead_456",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

### Link Clicked
```json
{
  "event": "email.clicked",
  "lead_email": "john@company.com",
  "campaign_id": "camp_123",
  "link_url": "https://example.com/pricing"
}
```

## Troubleshooting

### Webhook Not Working
1. Check Instantly webhook URL is correct
2. Check Vercel logs: `/api/webhooks/instantly`
3. Test webhook: `GET https://www.seodonscrm.co.uk/api/webhooks/instantly`

### Leads Not Showing Engagement
1. Verify email matches exactly in CRM and Instantly
2. Check `email_tracking_events` table in Supabase
3. Look for `[Instantly Webhook]` logs in Vercel

### No Open Tracking
1. Make sure Instantly campaign has "Track Opens" enabled
2. Check lead email is valid and not bounced
3. Some email clients block tracking pixels

## Features

✅ Real-time open tracking
✅ Click tracking with URL capture
✅ Reply detection
✅ Bounce management
✅ Multi-open counting (see how many times they opened)
✅ Last opened timestamp
✅ Hot lead identification
✅ Campaign-level tracking
✅ Search and filter by engagement

## Next Steps

1. Run migration 037
2. Set up webhook in Instantly
3. Import your first campaign
4. Watch the engagement data flow in!
5. Call hot leads (those who replied) immediately

**Pro Tip**: Filter by "Replied" in the engagement dashboard to see your hottest leads!
