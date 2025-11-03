# Migrations to Run in Supabase

After all the auto-send fixes, you need to run these migrations in your Supabase SQL Editor:

## Migration 032: Email 'sending' Status
```sql
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_status_check;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_status_check
CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'delivered', 'failed', 'received'));
```

## Migration 034: SMS 'sending' Status
```sql
ALTER TABLE sms_messages DROP CONSTRAINT IF EXISTS sms_messages_status_check;
ALTER TABLE sms_messages ADD CONSTRAINT sms_messages_status_check
CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'delivered', 'failed', 'received'));
```

## Migration 035: Make Names Optional
```sql
ALTER TABLE leads ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE leads ADD CONSTRAINT leads_contact_required
CHECK (email IS NOT NULL OR phone IS NOT NULL);
```

## Migration 036: Create Tasks System
```sql
-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT
  USING (auth.uid() IN (SELECT clerk_id FROM users WHERE id = tasks.user_id));

CREATE POLICY "Users can create their own tasks" ON tasks FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT clerk_id FROM users WHERE id = tasks.user_id));

CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE
  USING (auth.uid() IN (SELECT clerk_id FROM users WHERE id = tasks.user_id));

CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE
  USING (auth.uid() IN (SELECT clerk_id FROM users WHERE id = tasks.user_id));

CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();
```
