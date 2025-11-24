-- Migration: Integrate Leads with Call System
-- This connects leads to the calling infrastructure

-- ========================================
-- UPDATE CALL RECORDINGS TABLE
-- ========================================

-- Add lead_id to call_recordings table
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Create index for lead call queries
CREATE INDEX IF NOT EXISTS idx_call_recordings_lead_id ON call_recordings(lead_id);

-- Add comment
COMMENT ON COLUMN call_recordings.lead_id IS 'Links call to a lead (before conversion to customer)';

-- ========================================
-- TRIGGERS FOR LEAD STATUS UPDATES
-- ========================================

-- Function to auto-update lead when call is made
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
                WHEN NEW.customer_id IS NOT NULL THEN
                    'Called lead (linked to customer)'
                ELSE
                    'Called lead'
            END,
            NEW.duration_seconds / 60,
            CASE
                WHEN NEW.status = 'completed' THEN 'successful'
                WHEN NEW.status = 'no-answer' THEN 'no_answer'
                WHEN NEW.status = 'busy' THEN 'no_answer'
                WHEN NEW.status = 'failed' THEN 'not_interested'
                ELSE NULL
            END,
            NEW.recording_url,
            NEW.created_at,
            CASE
                WHEN NEW.ended_at IS NOT NULL THEN NEW.ended_at
                ELSE NOW()
            END
        ) ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new calls
DROP TRIGGER IF EXISTS trigger_update_lead_on_call ON call_recordings;
CREATE TRIGGER trigger_update_lead_on_call
    AFTER INSERT OR UPDATE ON call_recordings
    FOR EACH ROW
    WHEN (NEW.lead_id IS NOT NULL)
    EXECUTE FUNCTION update_lead_on_call();

-- ========================================
-- UPDATE CALL QUEUE FOR LEADS
-- ========================================

-- Add lead_id to call_queue table
ALTER TABLE call_queue
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_call_queue_lead_id ON call_queue(lead_id);

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- View for lead call statistics
CREATE OR REPLACE VIEW lead_call_stats AS
SELECT
    l.id AS lead_id,
    l.first_name,
    l.last_name,
    l.company,
    l.status,
    l.lead_score,
    COUNT(cr.id) AS total_calls,
    COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) AS completed_calls,
    COUNT(CASE WHEN cr.status IN ('no-answer', 'busy') THEN 1 END) AS missed_calls,
    MAX(cr.created_at) AS last_call_date,
    SUM(cr.duration_seconds) / 60 AS total_call_minutes,
    AVG(cr.sentiment_score) AS avg_sentiment
FROM leads l
LEFT JOIN call_recordings cr ON l.id = cr.lead_id
GROUP BY l.id, l.first_name, l.last_name, l.company, l.status, l.lead_score;

-- View for user call performance on leads
CREATE OR REPLACE VIEW user_lead_call_performance AS
SELECT
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.role,
    COUNT(DISTINCT cr.lead_id) AS leads_called,
    COUNT(cr.id) AS total_calls,
    COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) AS completed_calls,
    COUNT(CASE WHEN l.status = 'qualified' THEN 1 END) AS leads_qualified,
    COUNT(CASE WHEN l.status = 'converted' THEN 1 END) AS leads_converted,
    ROUND(
        COUNT(CASE WHEN l.status = 'qualified' THEN 1 END)::NUMERIC /
        NULLIF(COUNT(DISTINCT cr.lead_id), 0) * 100,
        2
    ) AS qualification_rate,
    ROUND(
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END)::NUMERIC /
        NULLIF(COUNT(DISTINCT cr.lead_id), 0) * 100,
        2
    ) AS conversion_rate,
    SUM(cr.duration_seconds) / 60 AS total_minutes,
    AVG(cr.sentiment_score) AS avg_sentiment
FROM users u
LEFT JOIN call_recordings cr ON u.id = cr.user_id
LEFT JOIN leads l ON cr.lead_id = l.id
WHERE cr.lead_id IS NOT NULL
GROUP BY u.id, u.first_name, u.last_name, u.role;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get lead call count
CREATE OR REPLACE FUNCTION get_lead_call_count(lead_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    call_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO call_count
    FROM call_recordings
    WHERE lead_id = lead_uuid;

    RETURN COALESCE(call_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if lead has been called today
CREATE OR REPLACE FUNCTION lead_called_today(lead_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_call BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM call_recordings
        WHERE lead_id = lead_uuid
        AND created_at >= CURRENT_DATE
    ) INTO has_call;

    RETURN COALESCE(has_call, false);
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON VIEW lead_call_stats IS 'Statistics for calls made to each lead';
COMMENT ON VIEW user_lead_call_performance IS 'Call performance metrics for users calling leads';
COMMENT ON FUNCTION get_lead_call_count IS 'Returns total number of calls made to a lead';
COMMENT ON FUNCTION lead_called_today IS 'Checks if a lead has been called today';
