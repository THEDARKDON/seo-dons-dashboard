-- Migration 030: Fix activity sync and add auto-customer creation from deals

-- ========================================
-- FIX: Ensure lead activities sync properly
-- ========================================

-- Update the trigger to handle both INSERT and UPDATE properly
CREATE OR REPLACE FUNCTION update_lead_on_call()
RETURNS TRIGGER AS $$
BEGIN
    -- If call is linked to a lead
    IF NEW.lead_id IS NOT NULL THEN
        -- Update lead status to 'contacted' if it's 'new'
        -- Update last_contacted_at timestamp
        UPDATE leads
        SET
            status = CASE
                WHEN status = 'new' THEN 'contacted'
                ELSE status
            END,
            last_contacted_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.lead_id;

        -- Log activity in lead_activities (only if not already exists)
        INSERT INTO lead_activities (
            lead_id,
            user_id,
            activity_type,
            subject,
            description,
            duration_minutes,
            outcome,
            call_recording_url,
            created_at,
            completed_at
        ) VALUES (
            NEW.lead_id,
            NEW.user_id,
            'call',
            'Outbound Call',
            CASE
                WHEN NEW.customer_id IS NOT NULL THEN
                    'Called lead (linked to customer)'
                ELSE
                    'Called lead'
            END,
            COALESCE(NEW.duration_seconds, 0) / 60.0,
            CASE
                WHEN NEW.status = 'completed' THEN 'successful'
                WHEN NEW.status = 'no-answer' THEN 'no_answer'
                WHEN NEW.status = 'busy' THEN 'no_answer'
                WHEN NEW.status = 'failed' THEN 'not_interested'
                ELSE NULL
            END,
            NEW.recording_url,
            NEW.created_at,
            COALESCE(NEW.ended_at, NOW())
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it fires on both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_update_lead_on_call ON call_recordings;
CREATE TRIGGER trigger_update_lead_on_call
    AFTER INSERT OR UPDATE OF status, duration_seconds, ended_at, recording_url
    ON call_recordings
    FOR EACH ROW
    WHEN (NEW.lead_id IS NOT NULL)
    EXECUTE FUNCTION update_lead_on_call();

-- ========================================
-- NEW: Auto-create customer from deal
-- ========================================

-- Function to auto-create customer when deal is created without one
CREATE OR REPLACE FUNCTION auto_create_customer_from_deal()
RETURNS TRIGGER AS $$
DECLARE
    new_customer_id UUID;
    lead_data RECORD;
BEGIN
    -- Only proceed if no customer_id is provided but we have contact info
    IF NEW.customer_id IS NULL AND NEW.contact_name IS NOT NULL THEN

        -- If deal has a lead_id, get lead data to populate customer
        IF NEW.lead_id IS NOT NULL THEN
            SELECT * INTO lead_data
            FROM leads
            WHERE id = NEW.lead_id;

            -- Create customer from lead data
            INSERT INTO customers (
                first_name,
                last_name,
                email,
                phone_number,
                company,
                industry,
                company_size,
                assigned_to,
                created_at,
                updated_at
            ) VALUES (
                lead_data.first_name,
                lead_data.last_name,
                lead_data.email,
                lead_data.phone_number,
                lead_data.company,
                lead_data.industry,
                lead_data.company_size,
                NEW.assigned_to,
                NOW(),
                NOW()
            )
            RETURNING id INTO new_customer_id;

            -- Update the deal with the new customer_id
            NEW.customer_id = new_customer_id;

            -- Update lead status to 'converted'
            UPDATE leads
            SET
                status = 'converted',
                updated_at = NOW()
            WHERE id = NEW.lead_id;

        ELSE
            -- Create customer from deal's contact info
            INSERT INTO customers (
                first_name,
                last_name,
                email,
                phone_number,
                company,
                assigned_to,
                created_at,
                updated_at
            ) VALUES (
                split_part(NEW.contact_name, ' ', 1),
                split_part(NEW.contact_name, ' ', 2),
                NEW.contact_email,
                NEW.contact_phone,
                NEW.company,
                NEW.assigned_to,
                NOW(),
                NOW()
            )
            RETURNING id INTO new_customer_id;

            -- Update the deal with the new customer_id
            NEW.customer_id = new_customer_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal customer auto-creation
DROP TRIGGER IF EXISTS trigger_auto_create_customer_from_deal ON deals;
CREATE TRIGGER trigger_auto_create_customer_from_deal
    BEFORE INSERT ON deals
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_from_deal();

-- ========================================
-- NEW: Create notifications table
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Notification content
    type TEXT NOT NULL CHECK (type IN ('sms_reply', 'email_reply', 'missed_call', 'inbound_call', 'new_lead', 'deal_stage_change', 'appointment_reminder', 'task_due', 'mention')),
    title TEXT NOT NULL,
    message TEXT,

    -- Related entities
    related_type TEXT CHECK (related_type IN ('lead', 'customer', 'deal', 'call', 'sms', 'email', 'appointment', 'task')),
    related_id UUID,

    -- Action link
    action_url TEXT,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS for notifications
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- ========================================
-- NEW: Auto-create notifications for key events
-- ========================================

-- Notify on inbound SMS
CREATE OR REPLACE FUNCTION notify_on_inbound_sms()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify for inbound messages
    IF NEW.direction = 'inbound' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            action_url
        ) VALUES (
            NEW.user_id,
            'sms_reply',
            'New SMS from ' || NEW.from_number,
            substring(NEW.body, 1, 100),
            'sms',
            NEW.id,
            '/dashboard/sms?conversation=' || NEW.conversation_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_inbound_sms ON sms_messages;
CREATE TRIGGER trigger_notify_on_inbound_sms
    AFTER INSERT ON sms_messages
    FOR EACH ROW
    WHEN (NEW.direction = 'inbound')
    EXECUTE FUNCTION notify_on_inbound_sms();

-- Notify on missed/inbound calls
CREATE OR REPLACE FUNCTION notify_on_missed_call()
RETURNS TRIGGER AS $$
DECLARE
    contact_name TEXT;
BEGIN
    -- Only notify for missed calls or inbound calls
    IF NEW.status IN ('no-answer', 'busy', 'failed') OR NEW.direction = 'inbound' THEN

        -- Get contact name
        SELECT COALESCE(first_name || ' ' || last_name, phone_number)
        INTO contact_name
        FROM customers
        WHERE id = NEW.customer_id
        LIMIT 1;

        IF contact_name IS NULL AND NEW.lead_id IS NOT NULL THEN
            SELECT COALESCE(first_name || ' ' || last_name, phone_number)
            INTO contact_name
            FROM leads
            WHERE id = NEW.lead_id
            LIMIT 1;
        END IF;

        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            action_url
        ) VALUES (
            NEW.user_id,
            CASE WHEN NEW.direction = 'inbound' THEN 'inbound_call' ELSE 'missed_call' END,
            CASE
                WHEN NEW.direction = 'inbound' THEN 'Inbound call from ' || COALESCE(contact_name, 'Unknown')
                ELSE 'Missed call to ' || COALESCE(contact_name, 'Unknown')
            END,
            'Call status: ' || NEW.status,
            'call',
            NEW.id,
            '/dashboard/calls/history/' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_missed_call ON call_recordings;
CREATE TRIGGER trigger_notify_on_missed_call
    AFTER INSERT OR UPDATE OF status
    ON call_recordings
    FOR EACH ROW
    WHEN (NEW.status IN ('no-answer', 'busy', 'failed') OR NEW.direction = 'inbound')
    EXECUTE FUNCTION notify_on_missed_call();

-- Notify on new lead assignment
CREATE OR REPLACE FUNCTION notify_on_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify assigned user of new lead
    IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            action_url
        ) VALUES (
            NEW.assigned_to,
            'new_lead',
            'New lead assigned: ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.company, 'Unknown'),
            'Source: ' || COALESCE(NEW.source, 'Unknown'),
            'lead',
            NEW.id,
            '/dashboard/leads/' || NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_new_lead ON leads;
CREATE TRIGGER trigger_notify_on_new_lead
    AFTER INSERT ON leads
    FOR EACH ROW
    WHEN (NEW.assigned_to IS NOT NULL)
    EXECUTE FUNCTION notify_on_new_lead();

-- Comments
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON COLUMN notifications.type IS 'Type of notification (sms_reply, missed_call, new_lead, etc.)';
COMMENT ON COLUMN notifications.related_id IS 'ID of the related entity (lead, deal, call, etc.)';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate when notification is clicked';
