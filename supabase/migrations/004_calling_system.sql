-- Call Recordings and VoIP Integration Tables
-- For SignalWire/Twilio integration

-- Call recordings table
CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_sid TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Call details
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT,
  to_number TEXT,
  status TEXT CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')),

  -- Duration and timestamps
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Recording and transcription
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  transcription TEXT,
  transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),

  -- AI analysis
  sentiment_score DECIMAL(3, 2), -- -1.00 to 1.00
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  key_topics TEXT[], -- Array of detected topics
  action_items TEXT[], -- Array of action items extracted
  ai_summary TEXT,

  -- Metadata
  call_quality_score INTEGER CHECK (call_quality_score >= 1 AND call_quality_score <= 5),
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call participants (for conference calls)
CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_recording_id UUID REFERENCES call_recordings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  phone_number TEXT NOT NULL,
  participant_type TEXT CHECK (participant_type IN ('agent', 'customer', 'third_party')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call dispositions (outcomes)
CREATE TABLE IF NOT EXISTS call_dispositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('connected', 'not_connected', 'scheduled', 'do_not_call')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default dispositions
INSERT INTO call_dispositions (name, category, description, sort_order) VALUES
  ('Connected - Interested', 'connected', 'Spoke with decision maker, showed interest', 1),
  ('Connected - Not Interested', 'connected', 'Spoke with decision maker, not interested', 2),
  ('Connected - Callback', 'connected', 'Requested callback at specific time', 3),
  ('Voicemail Left', 'not_connected', 'Left voicemail message', 4),
  ('No Answer', 'not_connected', 'Phone rang but no answer', 5),
  ('Wrong Number', 'not_connected', 'Incorrect contact information', 6),
  ('Meeting Scheduled', 'scheduled', 'Successfully scheduled meeting/demo', 7),
  ('Do Not Call', 'do_not_call', 'Requested to be removed from call list', 8)
ON CONFLICT (name) DO NOTHING;

-- VoIP settings per user
CREATE TABLE IF NOT EXISTS user_voip_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Phone numbers
  assigned_phone_number TEXT,
  caller_id_number TEXT,

  -- Preferences
  auto_record BOOLEAN DEFAULT TRUE,
  auto_transcribe BOOLEAN DEFAULT TRUE,
  voicemail_enabled BOOLEAN DEFAULT TRUE,
  voicemail_greeting_url TEXT,

  -- Call forwarding
  forward_to_number TEXT,
  forward_on_busy BOOLEAN DEFAULT FALSE,
  forward_on_no_answer BOOLEAN DEFAULT FALSE,

  -- Compliance
  tcpa_consent_recorded BOOLEAN DEFAULT FALSE,
  gdpr_consent_recorded BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call queue for power dialer
CREATE TABLE IF NOT EXISTS call_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  phone_number TEXT NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT CHECK (status IN ('queued', 'calling', 'completed', 'skipped', 'failed')) DEFAULT 'queued',

  scheduled_for TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCPA/GDPR Consent tracking
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  consent_type TEXT CHECK (consent_type IN ('tcpa_call', 'tcpa_sms', 'gdpr_processing', 'gdpr_marketing')),
  consent_given BOOLEAN DEFAULT FALSE,

  -- Proof of consent
  consent_method TEXT CHECK (consent_method IN ('verbal', 'written', 'electronic', 'implied')),
  consent_date TIMESTAMPTZ,
  consent_ip_address INET,
  consent_recording_url TEXT,

  -- Revocation
  revoked BOOLEAN DEFAULT FALSE,
  revoked_date TIMESTAMPTZ,
  revoked_method TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_call_recordings_user_id ON call_recordings(user_id);
CREATE INDEX idx_call_recordings_customer_id ON call_recordings(customer_id);
CREATE INDEX idx_call_recordings_deal_id ON call_recordings(deal_id);
CREATE INDEX idx_call_recordings_created_at ON call_recordings(created_at DESC);
CREATE INDEX idx_call_recordings_status ON call_recordings(status);

CREATE INDEX idx_call_queue_user_id ON call_queue(user_id);
CREATE INDEX idx_call_queue_status ON call_queue(status);
CREATE INDEX idx_call_queue_scheduled_for ON call_queue(scheduled_for);

CREATE INDEX idx_consent_records_customer_id ON consent_records(customer_id);
CREATE INDEX idx_consent_records_consent_type ON consent_records(consent_type);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_call_recordings_updated_at BEFORE UPDATE ON call_recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_dispositions_updated_at BEFORE UPDATE ON call_dispositions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_voip_settings_updated_at BEFORE UPDATE ON user_voip_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_queue_updated_at BEFORE UPDATE ON call_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (commented out for development, enable in production)
-- ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_dispositions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_voip_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
