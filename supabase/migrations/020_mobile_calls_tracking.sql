-- Create mobile_calls table for tracking mobile/external calls
CREATE TABLE IF NOT EXISTS mobile_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Call details
  phone_number VARCHAR(50) NOT NULL,
  contact_name VARCHAR(255),
  call_type VARCHAR(20) NOT NULL CHECK (call_type IN ('mobile', 'whatsapp', 'external', 'other')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Call metadata
  duration_seconds INTEGER DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('completed', 'no_answer', 'busy', 'failed', 'voicemail')),
  outcome VARCHAR(50) CHECK (outcome IN ('interested', 'not_interested', 'callback_scheduled', 'meeting_booked', 'no_decision', 'wrong_number', 'voicemail_left')),

  -- Notes and tracking
  notes TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Location tracking (optional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255),

  -- Timestamps
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_mobile_calls_user_id ON mobile_calls(user_id);
CREATE INDEX idx_mobile_calls_customer_id ON mobile_calls(customer_id);
CREATE INDEX idx_mobile_calls_called_at ON mobile_calls(called_at DESC);
CREATE INDEX idx_mobile_calls_phone_number ON mobile_calls(phone_number);
CREATE INDEX idx_mobile_calls_status ON mobile_calls(status);
CREATE INDEX idx_mobile_calls_outcome ON mobile_calls(outcome);

-- Create mobile_call_tags table for categorizing calls
CREATE TABLE IF NOT EXISTS mobile_call_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#gray',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS mobile_call_tag_relations (
  mobile_call_id UUID REFERENCES mobile_calls(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES mobile_call_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (mobile_call_id, tag_id)
);

-- Insert default tags
INSERT INTO mobile_call_tags (name, color) VALUES
  ('Cold Call', '#3B82F6'),
  ('Follow Up', '#10B981'),
  ('Demo', '#8B5CF6'),
  ('Negotiation', '#F59E0B'),
  ('Customer Support', '#EF4444'),
  ('Referral', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Create view for mobile calls with user and customer info
CREATE OR REPLACE VIEW mobile_calls_with_details AS
SELECT
  mc.*,
  u.first_name as user_first_name,
  u.last_name as user_last_name,
  u.email as user_email,
  c.first_name as customer_first_name,
  c.last_name as customer_last_name,
  c.company as customer_company,
  d.title as deal_title,
  d.stage as deal_stage,
  l.first_name as lead_first_name,
  l.last_name as lead_last_name,
  l.company as lead_company,
  ARRAY_AGG(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL) as tags
FROM mobile_calls mc
LEFT JOIN users u ON mc.user_id = u.id
LEFT JOIN customers c ON mc.customer_id = c.id
LEFT JOIN deals d ON mc.deal_id = d.id
LEFT JOIN leads l ON mc.lead_id = l.id
LEFT JOIN mobile_call_tag_relations mctr ON mc.id = mctr.mobile_call_id
LEFT JOIN mobile_call_tags t ON mctr.tag_id = t.id
GROUP BY mc.id, u.id, c.id, d.id, l.id;

-- Add RLS policies
ALTER TABLE mobile_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_call_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_call_tag_relations ENABLE ROW LEVEL SECURITY;

-- Users can see their own mobile calls
CREATE POLICY "Users can view own mobile calls" ON mobile_calls
  FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can insert their own mobile calls
CREATE POLICY "Users can insert own mobile calls" ON mobile_calls
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can update their own mobile calls
CREATE POLICY "Users can update own mobile calls" ON mobile_calls
  FOR UPDATE USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Admins can view all mobile calls
CREATE POLICY "Admins can view all mobile calls" ON mobile_calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Admins can update all mobile calls
CREATE POLICY "Admins can update all mobile calls" ON mobile_calls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Everyone can view tags
CREATE POLICY "Everyone can view tags" ON mobile_call_tags
  FOR SELECT USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags" ON mobile_call_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE clerk_id = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Users can manage their own call tags
CREATE POLICY "Users can manage own call tags" ON mobile_call_tag_relations
  FOR ALL USING (
    auth.uid()::text = (
      SELECT u.clerk_id FROM mobile_calls mc
      JOIN users u ON mc.user_id = u.id
      WHERE mc.id = mobile_call_id
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mobile_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_mobile_calls_updated_at
  BEFORE UPDATE ON mobile_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_mobile_calls_updated_at();