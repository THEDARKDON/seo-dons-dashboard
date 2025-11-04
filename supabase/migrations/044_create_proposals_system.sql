-- Migration 044: Create Proposals System for AI-Generated SEO Proposals
-- This migration creates the complete proposals system including:
-- 1. proposals table (main proposal records)
-- 2. proposal_packages table (pricing tiers configuration)
-- 3. proposal_activities table (audit trail)
-- 4. Supabase Storage bucket for PDFs

-- ==============================================
-- 1. CREATE PROPOSALS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS proposals (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number TEXT UNIQUE, -- P-2025-0001 (auto-generated)

  -- Relationships
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) NOT NULL,

  -- Proposal Details
  title TEXT NOT NULL, -- "Company Name SEO Investment Strategy & Growth Plan"
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_industry TEXT,
  service_area TEXT, -- "Lancashire & UK Nationwide"

  -- Status Management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Initial state
    'generating',   -- Claude is working
    'ready',        -- PDF generated, ready to send
    'sent',         -- Sent to customer
    'viewed',       -- Customer opened PDF
    'accepted',     -- Customer accepted
    'rejected'      -- Customer declined
  )),

  -- Research Data (JSONB for flexibility)
  research_data JSONB, -- Stores all Claude research results
  /*
  Example structure:
  {
    "company_analysis": {...},
    "market_intelligence": {...},
    "competitors": [...],
    "keywords": [...],
    "location_opportunities": [...]
  }
  */

  -- Generated Content (JSONB - all 18 pages)
  content_sections JSONB,
  /*
  Example structure:
  {
    "cover_page": {...},
    "executive_summary": {...},
    "current_vs_potential": {...},
    ... all 18 pages
  }
  */

  -- PDF Output
  pdf_url TEXT, -- Supabase Storage signed URL
  pdf_file_size INTEGER, -- bytes

  -- Package Selection
  selected_package TEXT CHECK (selected_package IN ('local', 'regional', 'national')),
  monthly_investment INTEGER, -- £2000, £3000, or £5000

  -- Performance Metrics
  generation_time_seconds INTEGER, -- How long Claude took
  claude_model TEXT DEFAULT 'claude-opus-4',
  total_tokens_used INTEGER,
  estimated_cost DECIMAL(10,4), -- API cost in GBP

  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validation
  CONSTRAINT valid_relationship CHECK (
    customer_id IS NOT NULL OR lead_id IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_customer ON proposals(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_deal ON proposals(deal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_number ON proposals(proposal_number);

-- ==============================================
-- 2. AUTO-GENERATE PROPOSAL NUMBER
-- ==============================================

CREATE SEQUENCE IF NOT EXISTS proposal_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_number IS NULL THEN
    NEW.proposal_number := 'P-' ||
      TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
      LPAD(nextval('proposal_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_proposal_number ON proposals;
CREATE TRIGGER set_proposal_number
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposal_number();

-- ==============================================
-- 3. UPDATED_AT TRIGGER
-- ==============================================

CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposals_updated_at();

-- ==============================================
-- 4. CREATE PROPOSAL_PACKAGES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS proposal_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Package Details
  package_key TEXT UNIQUE NOT NULL, -- 'local', 'regional', 'national'
  package_name TEXT NOT NULL, -- 'Local Dominance'
  monthly_investment INTEGER NOT NULL, -- £2000

  -- Features
  focus_description TEXT, -- "Blackpool & Fylde"
  keywords_targeted INTEGER, -- 15
  content_per_month INTEGER, -- 2 articles
  backlinks_per_month INTEGER, -- 5
  location_pages INTEGER, -- 8

  -- Expected Results (Month 12)
  expected_traffic_min INTEGER, -- 600
  expected_traffic_max INTEGER, -- 800
  expected_leads_min INTEGER, -- 20
  expected_leads_max INTEGER, -- 30
  revenue_impact_min INTEGER, -- £50,000
  revenue_impact_max INTEGER, -- £65,000
  roi_multiplier DECIMAL(5,2), -- 25.00 (25x)

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for 3 standard packages
INSERT INTO proposal_packages (
  package_key,
  package_name,
  monthly_investment,
  focus_description,
  keywords_targeted,
  content_per_month,
  backlinks_per_month,
  location_pages,
  expected_traffic_min,
  expected_traffic_max,
  expected_leads_min,
  expected_leads_max,
  revenue_impact_min,
  revenue_impact_max,
  roi_multiplier,
  display_order
) VALUES
(
  'local',
  'Local Dominance',
  2000,
  'Primary location & immediate area',
  15,
  2,
  5,
  8,
  600,
  800,
  20,
  30,
  50000,
  65000,
  25.00,
  1
),
(
  'regional',
  'Regional Authority',
  3000,
  'Regional coverage + key cities',
  50,
  4,
  10,
  20,
  1500,
  2000,
  40,
  60,
  100000,
  130000,
  33.00,
  2
),
(
  'national',
  'National Leader',
  5000,
  'UK-wide market domination',
  70,
  6,
  20,
  30,
  3500,
  5000,
  70,
  100,
  175000,
  250000,
  35.00,
  3
)
ON CONFLICT (package_key) DO NOTHING;

-- ==============================================
-- 5. CREATE PROPOSAL_ACTIVITIES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS proposal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',
    'generation_started',
    'research_completed',
    'content_generated',
    'pdf_created',
    'sent',
    'viewed',
    'downloaded',
    'accepted',
    'rejected',
    'edited',
    'regenerated'
  )),

  description TEXT,
  metadata JSONB, -- Additional context

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_activities_proposal ON proposal_activities(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_created_at ON proposal_activities(created_at DESC);

-- ==============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own proposals or all if admin
CREATE POLICY proposals_select_policy ON proposals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND (
        users.role = 'admin'
        OR proposals.created_by = users.id
      )
    )
  );

-- Policy: Users can insert proposals
CREATE POLICY proposals_insert_policy ON proposals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND proposals.created_by = users.id
    )
  );

-- Policy: Users can update their own proposals or all if admin
CREATE POLICY proposals_update_policy ON proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND (
        users.role = 'admin'
        OR proposals.created_by = users.id
      )
    )
  );

-- Policy: Only admins can delete proposals
CREATE POLICY proposals_delete_policy ON proposals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Policy: Everyone can view packages
CREATE POLICY proposal_packages_select_policy ON proposal_packages
  FOR SELECT
  USING (is_active = true);

-- Policy: Activities follow proposal access
CREATE POLICY proposal_activities_select_policy ON proposal_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_activities.proposal_id
      -- Inherits proposal access
    )
  );

-- ==============================================
-- 7. COMMENTS
-- ==============================================

COMMENT ON TABLE proposals IS 'AI-generated SEO proposals with research data and PDFs';
COMMENT ON TABLE proposal_packages IS 'Pricing tiers configuration for proposals';
COMMENT ON TABLE proposal_activities IS 'Audit trail for proposal lifecycle';
COMMENT ON COLUMN proposals.research_data IS 'JSONB containing all Claude research results';
COMMENT ON COLUMN proposals.content_sections IS 'JSONB containing all 18 pages of proposal content';
COMMENT ON COLUMN proposals.status IS 'Proposal lifecycle status';
COMMENT ON COLUMN proposals.estimated_cost IS 'Claude API cost in GBP';

-- ==============================================
-- 8. CREATE STORAGE BUCKET (if not exists)
-- ==============================================

-- Note: Storage bucket creation is usually done via Supabase Dashboard
-- SQL command for reference:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('proposal-pdfs', 'proposal-pdfs', false);

-- Storage policy for proposal PDFs (run after bucket creation)
-- CREATE POLICY "Authenticated users can upload proposals"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'proposal-pdfs');

-- CREATE POLICY "Users can view their own proposals"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'proposal-pdfs');

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 044: Proposals system created successfully';
  RAISE NOTICE 'Tables: proposals, proposal_packages, proposal_activities';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage bucket "proposal-pdfs" in Supabase Dashboard';
  RAISE NOTICE '2. Configure storage policies for proposal PDFs';
  RAISE NOTICE '3. Deploy Claude API integration code';
END $$;
