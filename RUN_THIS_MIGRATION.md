# 🚨 URGENT: Run This Database Migration

## Error Fixed
```
Could not find the table 'public.user_integrations' in the schema cache
```

## What to Do

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the ENTIRE content from: `supabase/migrations/028_create_user_integrations.sql`
6. Click **Run** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

### Option 2: Quick Copy-Paste

Copy this SQL and run it in Supabase SQL Editor:

```sql
-- Create user_integrations table for OAuth connections (Gmail, etc.)
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_provider ON user_integrations(provider);

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

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));
```

## Verify It Worked

Run this query to check the table was created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'user_integrations';
```

You should see `user_integrations` in the results.

## After Running Migration

1. Go back to your CRM: https://www.seodonscrm.co.uk/dashboard/email
2. Click "Connect Gmail Account" again
3. Should now work without errors!

## What This Table Does

This table stores OAuth tokens for external integrations:
- Gmail/Google Workspace (for email)
- Google Calendar (for appointments)
- Future integrations (Microsoft, LinkedIn, etc.)

Each user can have one integration per provider, and tokens are automatically refreshed when they expire.
