-- HOTFIX: Run this immediately to fix the errors
-- Copy and paste this entire file into Supabase SQL Editor and click RUN

-- ========================================
-- FIX 1: Update the lead activity trigger to use NULL instead of 'in_progress'
-- ========================================

CREATE OR REPLACE FUNCTION update_lead_on_call()
RETURNS TRIGGER AS $$
BEGIN
    -- If call is linked to a lead
    IF NEW.lead_id IS NOT NULL THEN
        -- Update lead status to 'contacted' if it's 'new'
        UPDATE leads
        SET
            status = CASE
                WHEN status = 'new' THEN 'contacted'
                ELSE status
            END,
            last_contacted_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.lead_id;

        -- Log activity in lead_activities
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
                WHEN NEW.customer_id IS NOT NULL THEN 'Called lead (linked to customer)'
                ELSE 'Called lead'
            END,
            COALESCE(NEW.duration_seconds, 0) / 60.0,
            CASE
                WHEN NEW.status = 'completed' THEN 'successful'
                WHEN NEW.status = 'no-answer' THEN 'no_answer'
                WHEN NEW.status = 'busy' THEN 'no_answer'
                WHEN NEW.status = 'failed' THEN 'not_interested'
                ELSE NULL  -- Changed from 'in_progress' to NULL
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

-- ========================================
-- FIX 2: Create notifications table
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sms_reply', 'email_reply', 'missed_call', 'inbound_call', 'new_lead', 'deal_stage_change', 'appointment_reminder', 'task_due', 'mention')),
    title TEXT NOT NULL,
    message TEXT,
    related_type TEXT CHECK (related_type IN ('lead', 'customer', 'deal', 'call', 'sms', 'email', 'appointment', 'task')),
    related_id UUID,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ========================================
-- FIX 3: Verify auto-send templates exist
-- ========================================

DO $$
DECLARE
    sms_count INTEGER;
    email_count INTEGER;
    admin_id UUID;
BEGIN
    -- Count existing templates
    SELECT COUNT(*) INTO sms_count FROM sms_templates WHERE auto_send_after_call = true;
    SELECT COUNT(*) INTO email_count FROM email_templates WHERE auto_send_after_call = true;

    RAISE NOTICE 'Found % auto-send SMS templates', sms_count;
    RAISE NOTICE 'Found % auto-send Email templates', email_count;

    -- If no templates, create them
    IF sms_count = 0 THEN
        RAISE NOTICE 'Creating default SMS templates...';

        SELECT id INTO admin_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;

        IF admin_id IS NULL THEN
            RAISE NOTICE 'WARNING: No admin user found. Using first user.';
            admin_id := (SELECT id FROM users ORDER BY created_at LIMIT 1);
        END IF;

        INSERT INTO sms_templates (name, body, category, is_active, auto_send_after_call, auto_send_delay_minutes, user_id)
        VALUES
        ('Successful Call Follow-up', 'Hi {first_name}, thank you for speaking with SEO Dons today! We''re excited to help grow your business. Visit: https://www.seodons.com', 'post_call', true, true, 0, admin_id),
        ('Missed Call Follow-up', 'Hi {first_name}, we tried to reach you at SEO Dons. Please call us back at your convenience. Looking forward to speaking with you!', 'post_call', true, true, 0, admin_id);

        RAISE NOTICE 'Created 2 SMS templates';
    END IF;

    IF email_count = 0 THEN
        RAISE NOTICE 'Creating default Email templates...';

        SELECT id INTO admin_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
        IF admin_id IS NULL THEN
            admin_id := (SELECT id FROM users ORDER BY created_at LIMIT 1);
        END IF;

        INSERT INTO email_templates (name, subject, body_html, category, is_active, auto_send_after_call, user_id)
        VALUES
        ('Successful Call Follow-up Email', 'Great speaking with you, {first_name}!', '<p>Hi {first_name},</p><p>Thank you for speaking with SEO Dons! Visit: <a href="https://www.seodons.com">seodons.com</a></p><p>Best,<br>SEO Dons Team</p>', 'post_call', true, true, admin_id),
        ('Missed Call Follow-up Email', 'We tried to reach you, {first_name}', '<p>Hi {first_name},</p><p>We tried to reach you. Please call back or reply to this email.</p><p>Best,<br>SEO Dons Team</p>', 'post_call', true, true, admin_id);

        RAISE NOTICE 'Created 2 Email templates';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOTFIX COMPLETE!';
    RAISE NOTICE 'Next: Refresh browser and test a call';
    RAISE NOTICE '========================================';
END $$;
