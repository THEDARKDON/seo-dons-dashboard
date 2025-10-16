-- Migration: Complete Lead Management System
-- This creates a full lead lifecycle from import to conversion

-- ========================================
-- LEADS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contact Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    website TEXT,
    linkedin_url TEXT,

    -- Lead Classification
    status TEXT CHECK (status IN (
        'new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'
    )) DEFAULT 'new',

    lead_source TEXT, -- CSV, Manual, API, Web Form, Referral, etc.
    lead_source_details TEXT, -- Specific campaign, file name, etc.

    -- Lead Scoring (0-100)
    lead_score INTEGER DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
    score_factors JSONB, -- What contributed to the score

    -- Assignment & Ownership
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,

    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,

    -- Additional Data
    industry TEXT,
    company_size TEXT,
    annual_revenue DECIMAL(15, 2),
    tags TEXT[], -- Array of tags for filtering
    custom_fields JSONB, -- Flexible custom data
    notes TEXT,

    -- Conversion Tracking
    converted_to_customer_id UUID REFERENCES customers(id),
    converted_at TIMESTAMPTZ,
    converted_by UUID REFERENCES users(id),

    -- Import Tracking
    import_id UUID, -- Links to lead_imports table
    import_row_number INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING gin(tags);

-- ========================================
-- LEAD IMPORTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS lead_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Import Details
    file_name TEXT NOT NULL,
    file_size INTEGER, -- bytes
    import_source TEXT NOT NULL, -- CSV, API, Manual, etc.

    -- Statistics
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_imports INTEGER DEFAULT 0,
    failed_imports INTEGER DEFAULT 0,
    duplicate_skipped INTEGER DEFAULT 0,

    -- Status
    status TEXT CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )) DEFAULT 'pending',

    -- User & Timestamps
    imported_by UUID REFERENCES users(id) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Configuration
    column_mapping JSONB, -- How CSV columns map to lead fields
    duplicate_handling TEXT, -- skip, update, create_new

    -- Error Tracking
    error_log JSONB, -- Array of errors with row numbers

    -- Metadata
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_imports_imported_by ON lead_imports(imported_by);
CREATE INDEX IF NOT EXISTS idx_lead_imports_status ON lead_imports(status);
CREATE INDEX IF NOT EXISTS idx_lead_imports_started_at ON lead_imports(started_at DESC);

-- ========================================
-- LEAD ACTIVITIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,

    -- Activity Details
    activity_type TEXT CHECK (activity_type IN (
        'call', 'email', 'sms', 'meeting', 'note',
        'status_change', 'score_change', 'assigned'
    )) NOT NULL,

    subject TEXT,
    description TEXT,

    -- Outcome
    outcome TEXT CHECK (outcome IN (
        'successful', 'no_answer', 'voicemail', 'callback_scheduled',
        'not_interested', 'qualified', 'unqualified'
    )),

    -- Call-specific
    duration_minutes INTEGER,
    call_recording_url TEXT,

    -- Email-specific
    email_opened BOOLEAN DEFAULT false,
    email_clicked BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);

-- ========================================
-- LEAD SOURCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Source Type
    source_type TEXT CHECK (source_type IN (
        'organic', 'paid', 'referral', 'direct', 'social', 'event', 'partner', 'other'
    )) NOT NULL,

    -- Campaign Tracking
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    -- Performance Metrics
    total_leads INTEGER DEFAULT 0,
    converted_leads INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2), -- Calculated percentage

    cost_per_lead DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),

    -- Status
    active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_active ON lead_sources(active);
CREATE INDEX IF NOT EXISTS idx_lead_sources_source_type ON lead_sources(source_type);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update lead updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads table
DROP TRIGGER IF EXISTS trigger_update_lead_timestamp ON leads;
CREATE TRIGGER trigger_update_lead_timestamp
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_updated_at();

-- Function to auto-calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    factors JSONB := '{}';
BEGIN
    -- Email domain scoring
    IF NEW.email IS NOT NULL THEN
        IF NEW.email LIKE '%@gmail.com' OR NEW.email LIKE '%@yahoo.com' OR NEW.email LIKE '%@hotmail.com' THEN
            score := score + 5;
            factors := jsonb_set(factors, '{email_type}', '"personal"');
        ELSE
            score := score + 15;
            factors := jsonb_set(factors, '{email_type}', '"business"');
        END IF;
    END IF;

    -- Company presence
    IF NEW.company IS NOT NULL AND LENGTH(NEW.company) > 0 THEN
        score := score + 10;
        factors := jsonb_set(factors, '{has_company}', 'true');
    END IF;

    -- Job title presence
    IF NEW.job_title IS NOT NULL THEN
        score := score + 10;
        factors := jsonb_set(factors, '{has_job_title}', 'true');

        -- Decision maker keywords
        IF NEW.job_title ILIKE ANY(ARRAY['%CEO%', '%CTO%', '%CMO%', '%Director%', '%VP%', '%President%', '%Owner%', '%Founder%']) THEN
            score := score + 20;
            factors := jsonb_set(factors, '{decision_maker}', 'true');
        END IF;
    END IF;

    -- Phone presence
    IF NEW.phone IS NOT NULL THEN
        score := score + 10;
        factors := jsonb_set(factors, '{has_phone}', 'true');
    END IF;

    -- Website presence
    IF NEW.website IS NOT NULL THEN
        score := score + 5;
        factors := jsonb_set(factors, '{has_website}', 'true');
    END IF;

    -- LinkedIn presence
    IF NEW.linkedin_url IS NOT NULL THEN
        score := score + 10;
        factors := jsonb_set(factors, '{has_linkedin}', 'true');
    END IF;

    -- Recent activity bonus
    IF NEW.last_contacted_at IS NOT NULL AND NEW.last_contacted_at > NOW() - INTERVAL '7 days' THEN
        score := score + 15;
        factors := jsonb_set(factors, '{recently_contacted}', 'true');
    END IF;

    -- Cap at 100
    IF score > 100 THEN
        score := 100;
    END IF;

    NEW.lead_score := score;
    NEW.score_factors := factors;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for lead scoring
DROP TRIGGER IF EXISTS trigger_calculate_lead_score ON leads;
CREATE TRIGGER trigger_calculate_lead_score
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION calculate_lead_score();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_activities (
            lead_id,
            user_id,
            activity_type,
            subject,
            description,
            completed_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.assigned_to, NEW.converted_by, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
            'status_change',
            'Status Changed',
            'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status change logging
DROP TRIGGER IF EXISTS trigger_log_lead_status_change ON leads;
CREATE TRIGGER trigger_log_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_lead_status_change();

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert default lead sources
INSERT INTO lead_sources (name, source_type, description) VALUES
    ('Website Organic', 'organic', 'Organic website visitors'),
    ('Google Ads', 'paid', 'Google advertising campaigns'),
    ('LinkedIn', 'social', 'LinkedIn connections and InMail'),
    ('Referrals', 'referral', 'Customer and partner referrals'),
    ('Trade Shows', 'event', 'Industry events and trade shows'),
    ('Cold Outreach', 'direct', 'Outbound prospecting'),
    ('CSV Import', 'direct', 'Bulk imported leads')
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE leads IS 'Central lead storage with scoring and conversion tracking';
COMMENT ON TABLE lead_imports IS 'Tracks bulk imports from CSV and other sources';
COMMENT ON TABLE lead_activities IS 'Activity timeline for leads before conversion';
COMMENT ON TABLE lead_sources IS 'Source tracking and performance metrics';
