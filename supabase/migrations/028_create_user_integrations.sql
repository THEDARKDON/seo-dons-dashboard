-- Create user_integrations table for OAuth connections (Gmail, etc.)
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- 'google', 'microsoft', etc.
    provider_user_id TEXT, -- External user ID from the provider
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    scopes TEXT[], -- Array of OAuth scopes granted
    metadata JSONB DEFAULT '{}', -- Store email, name, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider) -- One integration per provider per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_integrations_updated_at();

-- Add RLS policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can read their own integrations
CREATE POLICY "Users can view their own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

COMMENT ON TABLE user_integrations IS 'Stores OAuth integrations for external services (Gmail, Calendar, etc.)';
COMMENT ON COLUMN user_integrations.provider IS 'Service provider name: google, microsoft, etc.';
COMMENT ON COLUMN user_integrations.scopes IS 'Array of OAuth scopes granted by the user';
COMMENT ON COLUMN user_integrations.metadata IS 'Additional provider data like email, profile info, etc.';
