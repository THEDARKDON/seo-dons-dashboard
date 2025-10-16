-- SEO Dons Sales Dashboard - Database Schema (FIXED ORDER)
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table (must be created FIRST)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    manager_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (synced with Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT CHECK (role IN ('bdr', 'manager', 'admin')) DEFAULT 'bdr',
    team_id UUID REFERENCES teams(id),
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add the foreign key for teams.manager_id
ALTER TABLE teams ADD CONSTRAINT teams_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES users(id);

-- Customers/Contacts
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id TEXT UNIQUE,
    apollo_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    enrichment_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals/Opportunities
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hubspot_id TEXT UNIQUE,
    customer_id UUID REFERENCES customers(id),
    assigned_to UUID REFERENCES users(id) NOT NULL,
    deal_name TEXT NOT NULL,
    deal_value DECIMAL(12, 2) NOT NULL,
    stage TEXT CHECK (stage IN (
        'prospecting', 'qualification', 'proposal',
        'negotiation', 'closed_won', 'closed_lost'
    )) DEFAULT 'prospecting',
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE,
    actual_close_date DATE,
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (Calls, Emails, Meetings)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    deal_id UUID REFERENCES deals(id),
    activity_type TEXT CHECK (activity_type IN (
        'call', 'email', 'meeting', 'demo', 'note'
    )) NOT NULL,
    subject TEXT,
    description TEXT,
    duration_minutes INTEGER,
    outcome TEXT CHECK (outcome IN (
        'successful', 'no_answer', 'voicemail', 'callback_scheduled', 'not_interested'
    )),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    deal_id UUID REFERENCES deals(id),
    title TEXT NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN (
        'scheduled', 'completed', 'cancelled', 'no_show'
    )) DEFAULT 'scheduled',
    meeting_url TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commissions
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    deal_id UUID REFERENCES deals(id) NOT NULL,
    commission_type TEXT CHECK (commission_type IN (
        'first_month', 'ongoing', 'bonus'
    )) NOT NULL,
    rate DECIMAL(5, 4) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    period_start DATE,
    period_end DATE,
    status TEXT CHECK (status IN (
        'pending', 'approved', 'paid', 'disputed'
    )) DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements/Badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    badge_image_url TEXT,
    category TEXT,
    points INTEGER DEFAULT 0,
    criteria JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Streaks
CREATE TABLE streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    streak_type TEXT CHECK (streak_type IN (
        'daily_calls', 'weekly_meetings', 'deal_closing'
    )) NOT NULL,
    current_count INTEGER DEFAULT 0,
    longest_count INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- Create indexes for performance
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_completed_at ON activities(completed_at);
CREATE INDEX idx_commissions_user_id ON commissions(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BDRs see own deals" ON deals
    FOR SELECT
    USING (
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin'))
    );

-- Function to auto-create commission records
CREATE OR REPLACE FUNCTION create_commission_record()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stage = 'closed_won' AND OLD.stage != 'closed_won' THEN
        -- First month commission (50%)
        INSERT INTO commissions (user_id, deal_id, commission_type, rate, amount, period_start, period_end)
        VALUES (
            NEW.assigned_to, NEW.id, 'first_month', 0.50, NEW.deal_value * 0.50,
            DATE_TRUNC('month', CURRENT_DATE),
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        );

        -- Ongoing commission (10% recurring)
        INSERT INTO commissions (user_id, deal_id, commission_type, rate, amount, period_start, period_end)
        VALUES (
            NEW.assigned_to, NEW.id, 'ongoing', 0.10, NEW.deal_value * 0.10,
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_commission
AFTER UPDATE OF stage ON deals
FOR EACH ROW
EXECUTE FUNCTION create_commission_record();

-- Seed achievements
INSERT INTO achievements (code, name, description, category, points, criteria) VALUES
('first_call', 'First Call', 'Made your first call', 'activity', 10, '{"type": "call_count", "threshold": 1}'),
('call_master_50', 'Call Master', 'Made 50 calls in a day', 'activity', 100, '{"type": "daily_calls", "threshold": 50}'),
('deal_closer', 'Deal Closer', 'Closed your first deal', 'sales', 200, '{"type": "deals_closed", "threshold": 1}'),
('revenue_10k', 'Revenue Generator', 'Generated $10K in revenue', 'sales', 500, '{"type": "total_revenue", "threshold": 10000}'),
('meeting_setter', 'Meeting Setter', 'Scheduled 10 meetings', 'activity', 150, '{"type": "meetings_set", "threshold": 10}'),
('streak_7', '7-Day Streak', 'Maintained activity for 7 consecutive days', 'streak', 300, '{"type": "daily_streak", "threshold": 7}');
