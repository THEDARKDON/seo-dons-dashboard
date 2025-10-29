-- Create user_phone_numbers table for tracking assigned phone numbers
CREATE TABLE IF NOT EXISTS user_phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT NOT NULL,
    phone_sid TEXT, -- Twilio Phone Number SID
    friendly_name TEXT,
    is_active BOOLEAN DEFAULT true,
    capabilities JSONB DEFAULT '{
        "voice": true,
        "sms": false,
        "mms": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(phone_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON user_phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_phone_number ON user_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_is_active ON user_phone_numbers(is_active);

-- Disable RLS
ALTER TABLE user_phone_numbers DISABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_phone_numbers_updated_at ON user_phone_numbers;
CREATE TRIGGER trigger_update_user_phone_numbers_updated_at
    BEFORE UPDATE ON user_phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_user_phone_numbers_updated_at();

-- Comments
COMMENT ON TABLE user_phone_numbers IS 'Phone numbers assigned to users for inbound/outbound calls';
COMMENT ON COLUMN user_phone_numbers.phone_number IS 'Phone number in E.164 format (e.g., +14155551234)';
COMMENT ON COLUMN user_phone_numbers.phone_sid IS 'Twilio Phone Number SID';
COMMENT ON COLUMN user_phone_numbers.is_active IS 'Whether this phone number is currently active';
