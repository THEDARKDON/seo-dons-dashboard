-- SMS Messages System
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    body TEXT NOT NULL,
    status TEXT CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received')) DEFAULT 'queued',

    -- Twilio specific
    message_sid TEXT UNIQUE,
    num_segments INTEGER DEFAULT 1,
    num_media INTEGER DEFAULT 0,
    media_urls JSONB DEFAULT '[]'::jsonb,
    error_code TEXT,
    error_message TEXT,

    -- Relations
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    call_id UUID REFERENCES call_recordings(id) ON DELETE SET NULL,

    -- Conversation grouping (phone number of other party)
    conversation_id TEXT NOT NULL,

    -- Read status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Templates
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT CHECK (category IN ('follow_up', 'appointment', 'general', 'post_call')) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,

    -- Auto-send settings
    auto_send_after_call BOOLEAN DEFAULT false,
    auto_send_delay_minutes INTEGER DEFAULT 2,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Messages System
CREATE TABLE IF NOT EXISTS email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    cc_email TEXT[],
    bcc_email TEXT[],
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT,
    body_html TEXT,
    status TEXT CHECK (status IN ('draft', 'queued', 'sent', 'delivered', 'failed', 'received')) DEFAULT 'queued',

    -- Gmail specific
    gmail_message_id TEXT,
    gmail_thread_id TEXT,

    -- Attachments
    has_attachments BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]'::jsonb,

    -- Relations
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    call_id UUID REFERENCES call_recordings(id) ON DELETE SET NULL,

    -- Conversation grouping
    conversation_id TEXT NOT NULL, -- Email of other party or thread_id

    -- Read status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    category TEXT CHECK (category IN ('follow_up', 'appointment', 'proposal', 'general', 'post_call')) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,

    -- Auto-send settings
    auto_send_after_call BOOLEAN DEFAULT false,
    auto_send_delay_minutes INTEGER DEFAULT 5,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update user_voip_settings for SMS/Email preferences
ALTER TABLE user_voip_settings
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_sms_after_call BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_sms_template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_email_after_call BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;

-- Create indexes for SMS
CREATE INDEX IF NOT EXISTS idx_sms_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_conversation ON sms_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_from_number ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_to_number ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_created_at ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_unread ON sms_messages(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_sms_message_sid ON sms_messages(message_sid);

-- Create indexes for Email
CREATE INDEX IF NOT EXISTS idx_email_user_id ON email_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_email_conversation ON email_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_direction ON email_messages(direction);
CREATE INDEX IF NOT EXISTS idx_email_from_email ON email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_to_email ON email_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_email_created_at ON email_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_unread ON email_messages(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_email_gmail_message_id ON email_messages(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_email_gmail_thread_id ON email_messages(gmail_thread_id);

-- Disable RLS (protected by Clerk middleware)
ALTER TABLE sms_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_sms_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_email_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sms_messages_updated_at ON sms_messages;
CREATE TRIGGER trigger_update_sms_messages_updated_at
    BEFORE UPDATE ON sms_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_messages_updated_at();

DROP TRIGGER IF EXISTS trigger_update_email_messages_updated_at ON email_messages;
CREATE TRIGGER trigger_update_email_messages_updated_at
    BEFORE UPDATE ON email_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_email_messages_updated_at();

-- Comments
COMMENT ON TABLE sms_messages IS 'SMS messages sent and received via Twilio';
COMMENT ON TABLE sms_templates IS 'Reusable SMS message templates';
COMMENT ON TABLE email_messages IS 'Email messages sent and received via Gmail';
COMMENT ON TABLE email_templates IS 'Reusable email templates';
COMMENT ON COLUMN sms_messages.conversation_id IS 'Phone number of the other party for grouping messages';
COMMENT ON COLUMN email_messages.conversation_id IS 'Email address or thread_id for grouping messages';
