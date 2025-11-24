-- =====================================================
-- Migration 037: Add Instantly.ai Email Tracking
-- =====================================================
-- Date: 2025-11-02
-- Purpose: Track email opens from Instantly.ai campaigns and categorize leads
-- =====================================================

-- Add Instantly tracking fields to leads table
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

-- Create email_tracking_events table for detailed tracking
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  email_message_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT CHECK (event_type IN ('opened', 'clicked', 'replied', 'bounced', 'unsubscribed')) NOT NULL,
  instantly_campaign_id TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  clicked_link TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_instantly_campaign_id ON leads(instantly_campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_instantly_lead_id ON leads(instantly_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email_opened ON leads(email_opened);
CREATE INDEX IF NOT EXISTS idx_leads_instantly_status ON leads(instantly_status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_lead_id ON email_tracking_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_event_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_created_at ON email_tracking_events(created_at);

-- Enable RLS on email_tracking_events
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_tracking_events
CREATE POLICY "Users can view tracking events for their leads"
  ON email_tracking_events FOR SELECT
  USING (lead_id IN (
    SELECT id FROM leads WHERE assigned_to IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  ));

CREATE POLICY "Service role can insert tracking events"
  ON email_tracking_events FOR INSERT
  WITH CHECK (true); -- Webhooks use service role

-- Add comments
COMMENT ON COLUMN leads.instantly_campaign_id IS 'Instantly.ai campaign ID for tracking';
COMMENT ON COLUMN leads.instantly_lead_id IS 'Instantly.ai lead ID for tracking';
COMMENT ON COLUMN leads.email_opened IS 'Whether the lead has opened any email';
COMMENT ON COLUMN leads.email_opened_count IS 'Number of times emails were opened';
COMMENT ON COLUMN leads.instantly_status IS 'Lead status from Instantly: active, paused, completed, bounced';
COMMENT ON TABLE email_tracking_events IS 'Detailed email engagement tracking events';
