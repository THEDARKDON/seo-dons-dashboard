-- Assign Twilio phone number to user
-- Run this in Supabase SQL Editor

-- First, let's check if the user_voip_settings table exists and has the right structure
-- If migration 009 hasn't been applied yet, this will create it

-- Create user_voip_settings table if not exists
CREATE TABLE IF NOT EXISTS user_voip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_phone_number VARCHAR(20) NOT NULL,
  caller_id_number VARCHAR(20),
  auto_record BOOLEAN DEFAULT true,
  auto_transcribe BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create call_recordings table if not exists
CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  status VARCHAR(50),
  duration INTEGER,
  recording_sid VARCHAR(100),
  recording_url TEXT,
  recording_duration INTEGER,
  transcription_status VARCHAR(50),
  transcription_text TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_queue table if not exists
CREATE TABLE IF NOT EXISTS call_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'calling', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_recordings_user_id ON call_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_lead_id ON call_recordings(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_customer_id ON call_recordings(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_deal_id ON call_recordings(deal_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_user_id ON call_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status);

-- Enable Row Level Security
ALTER TABLE user_voip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_voip_settings
DROP POLICY IF EXISTS "Users can view own VoIP settings" ON user_voip_settings;
CREATE POLICY "Users can view own VoIP settings" ON user_voip_settings
  FOR SELECT USING (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = user_id));

DROP POLICY IF EXISTS "Admins can manage all VoIP settings" ON user_voip_settings;
CREATE POLICY "Admins can manage all VoIP settings" ON user_voip_settings
  FOR ALL USING (
    auth.uid()::text IN (SELECT clerk_id FROM users WHERE role = 'admin')
  );

-- RLS Policies for call_recordings
DROP POLICY IF EXISTS "Users can view own call recordings" ON call_recordings;
CREATE POLICY "Users can view own call recordings" ON call_recordings
  FOR SELECT USING (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = user_id));

DROP POLICY IF EXISTS "Admins can view all call recordings" ON call_recordings;
CREATE POLICY "Admins can view all call recordings" ON call_recordings
  FOR SELECT USING (
    auth.uid()::text IN (SELECT clerk_id FROM users WHERE role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Users can insert own call recordings" ON call_recordings;
CREATE POLICY "Users can insert own call recordings" ON call_recordings
  FOR INSERT WITH CHECK (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = user_id));

-- RLS Policies for call_queue
DROP POLICY IF EXISTS "Users can view own call queue" ON call_queue;
CREATE POLICY "Users can view own call queue" ON call_queue
  FOR SELECT USING (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can manage own call queue" ON call_queue;
CREATE POLICY "Users can manage own call queue" ON call_queue
  FOR ALL USING (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = user_id));

-- Now assign the phone number to the first user (you can modify this)
-- This assigns +447700158258 to the first admin user

INSERT INTO user_voip_settings (user_id, assigned_phone_number, caller_id_number, auto_record, auto_transcribe)
SELECT
  id,
  '+447700158258',
  '+447700158258',
  true,
  true
FROM users
WHERE role = 'admin'
LIMIT 1
ON CONFLICT (user_id)
DO UPDATE SET
  assigned_phone_number = EXCLUDED.assigned_phone_number,
  caller_id_number = EXCLUDED.caller_id_number,
  updated_at = NOW();

-- Verify the assignment
SELECT
  u.email,
  u.role,
  v.assigned_phone_number,
  v.auto_record,
  v.auto_transcribe
FROM users u
JOIN user_voip_settings v ON u.id = v.user_id;
