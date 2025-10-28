-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN (
        'scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'
    )) DEFAULT 'scheduled',
    meeting_type TEXT CHECK (meeting_type IN (
        'discovery', 'demo', 'proposal', 'follow_up', 'closing', 'other'
    )),
    meeting_url TEXT,
    location TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    outcome TEXT, -- Result of the meeting
    calendar_event_id TEXT,
    calendar_event_link TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add lead_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'appointments' AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE appointments ADD COLUMN lead_id UUID;
    END IF;
END $$;

-- Add foreign key to leads if the leads table exists and constraint doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads')
       AND NOT EXISTS (
           SELECT 1 FROM information_schema.table_constraints
           WHERE constraint_name = 'fk_appointments_lead_id'
           AND table_name = 'appointments'
       ) THEN
        ALTER TABLE appointments
        ADD CONSTRAINT fk_appointments_lead_id
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_deal_id ON appointments(deal_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Disable RLS (already protected by Clerk middleware at API level)
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Comments
COMMENT ON TABLE appointments IS 'Scheduled appointments and meetings with customers and leads';
COMMENT ON COLUMN appointments.scheduled_start IS 'When the appointment is scheduled to start';
COMMENT ON COLUMN appointments.created_at IS 'When the appointment was booked/created in the system';
