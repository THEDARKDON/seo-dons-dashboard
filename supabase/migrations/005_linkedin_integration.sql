-- LinkedIn Social Media Integration Tables

-- LinkedIn OAuth tokens per user
CREATE TABLE IF NOT EXISTS linkedin_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- OAuth credentials
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- LinkedIn profile info
  linkedin_user_id TEXT UNIQUE NOT NULL,
  linkedin_email TEXT,
  profile_name TEXT,
  profile_picture_url TEXT,
  profile_url TEXT,

  -- Connection status
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled social media posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Post content
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  hashtags TEXT[],

  -- LinkedIn specific
  visibility TEXT CHECK (visibility IN ('public', 'connections', 'logged_in')) DEFAULT 'public',

  -- Scheduling
  status TEXT CHECK (status IN ('draft', 'scheduled', 'pending_approval', 'approved', 'published', 'failed')) DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- LinkedIn response
  linkedin_post_id TEXT,
  linkedin_post_url TEXT,

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Analytics (populated later via LinkedIn API)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,

  -- Metadata
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content library/templates
CREATE TABLE IF NOT EXISTS post_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  content_template TEXT NOT NULL,

  -- Variables that can be inserted (e.g., {{company_name}}, {{service}})
  variables TEXT[],

  -- Categorization
  category TEXT, -- e.g., 'case_study', 'tip', 'announcement'
  tags TEXT[],

  -- Usage stats
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post performance tracking
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,

  -- Metrics snapshot
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,

  -- Engagement rate calculation
  engagement_rate DECIMAL(5, 2),

  -- Timestamp of this snapshot
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posting schedule/calendar
CREATE TABLE IF NOT EXISTS posting_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Schedule configuration
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  time_of_day TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',

  -- Post type for this slot
  preferred_category TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social selling metrics
CREATE TABLE IF NOT EXISTS social_selling_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Date for this metric snapshot
  metric_date DATE NOT NULL,

  -- LinkedIn SSI components (0-100 each)
  establish_brand_score INTEGER,
  find_people_score INTEGER,
  engage_insights_score INTEGER,
  build_relationships_score INTEGER,
  total_ssi_score INTEGER, -- Sum of above 4

  -- Profile metrics
  profile_views INTEGER DEFAULT 0,
  search_appearances INTEGER DEFAULT 0,
  connection_requests_sent INTEGER DEFAULT 0,
  connection_requests_received INTEGER DEFAULT 0,
  connections_added INTEGER DEFAULT 0,

  -- Content metrics
  posts_published INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5, 2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, metric_date)
);

-- Indexes for performance
CREATE INDEX idx_linkedin_connections_user_id ON linkedin_connections(user_id);
CREATE INDEX idx_linkedin_connections_linkedin_user_id ON linkedin_connections(linkedin_user_id);

CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_for ON social_posts(scheduled_for);
CREATE INDEX idx_social_posts_published_at ON social_posts(published_at);

CREATE INDEX idx_post_templates_user_id ON post_templates(user_id);
CREATE INDEX idx_post_templates_category ON post_templates(category);

CREATE INDEX idx_post_analytics_social_post_id ON post_analytics(social_post_id);
CREATE INDEX idx_post_analytics_snapshot_at ON post_analytics(snapshot_at);

CREATE INDEX idx_posting_schedule_user_id ON posting_schedule(user_id);
CREATE INDEX idx_posting_schedule_day_of_week ON posting_schedule(day_of_week);

CREATE INDEX idx_social_selling_metrics_user_id ON social_selling_metrics(user_id);
CREATE INDEX idx_social_selling_metrics_metric_date ON social_selling_metrics(metric_date);

-- Updated_at triggers
CREATE TRIGGER update_linkedin_connections_updated_at BEFORE UPDATE ON linkedin_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_templates_updated_at BEFORE UPDATE ON post_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posting_schedule_updated_at BEFORE UPDATE ON posting_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (commented out for development, enable in production)
-- ALTER TABLE linkedin_connections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posting_schedule ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE social_selling_metrics ENABLE ROW LEVEL SECURITY;

-- Insert default post templates
INSERT INTO post_templates (user_id, name, description, content_template, variables, category) VALUES
(
  (SELECT id FROM users LIMIT 1), -- Replace with actual admin user ID
  'Case Study Template',
  'Share customer success stories',
  '🎯 Success Story Alert!\n\nWe helped {{company_name}} achieve {{result}} through our {{service}}.\n\n✅ Challenge: {{challenge}}\n✅ Solution: {{solution}}\n✅ Result: {{result}}\n\nWant similar results? Let''s talk! 👇\n\n#SEO #DigitalMarketing #CaseStudy',
  ARRAY['company_name', 'result', 'service', 'challenge', 'solution'],
  'case_study'
),
(
  (SELECT id FROM users LIMIT 1),
  'SEO Tip Template',
  'Share valuable SEO tips',
  '💡 SEO Tip of the Day\n\n{{tip_title}}\n\n{{tip_description}}\n\nTry this today and let me know your results!\n\n#SEO #DigitalMarketing #MarketingTips',
  ARRAY['tip_title', 'tip_description'],
  'tip'
),
(
  (SELECT id FROM users LIMIT 1),
  'Industry Insight Template',
  'Share industry trends and insights',
  '📊 Industry Insight\n\n{{insight}}\n\nWhat does this mean for your business?\n\n{{implication}}\n\nThoughts? Drop a comment below! 👇\n\n#Marketing #BusinessGrowth #SEO',
  ARRAY['insight', 'implication'],
  'insight'
)
ON CONFLICT DO NOTHING;
