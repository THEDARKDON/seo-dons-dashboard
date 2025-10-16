-- Quick SQL to assign phone number to your admin user
-- Copy and paste this into Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/xowomlotlfhsjshmvjnw/sql/new

-- Create tables if they don't exist
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

-- Assign phone number to admin user
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
  assigned_phone_number = '+447700158258',
  caller_id_number = '+447700158258',
  updated_at = NOW();

-- Show result
SELECT
  u.email,
  u.role,
  v.assigned_phone_number,
  v.caller_id_number
FROM users u
JOIN user_voip_settings v ON u.id = v.user_id;
