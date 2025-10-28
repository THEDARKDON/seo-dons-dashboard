-- LinkedIn Post Templates System
-- Allows admins to create post templates that SDRs can use

-- Create post templates table
CREATE TABLE IF NOT EXISTS linkedin_post_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT, -- URL to image or video
    media_type TEXT CHECK (media_type IN ('image', 'video', 'document')),
    category TEXT, -- e.g., 'industry_news', 'company_update', 'thought_leadership'
    tags TEXT[], -- Array of tags for filtering
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post history table to track SDR posts
CREATE TABLE IF NOT EXISTS linkedin_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES linkedin_post_templates(id) ON DELETE SET NULL,
    linkedin_post_id TEXT, -- LinkedIn's post ID from API response
    content TEXT NOT NULL,
    media_url TEXT,
    status TEXT CHECK (status IN ('draft', 'scheduled', 'published', 'failed')) DEFAULT 'draft',
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    error_message TEXT,
    engagement_likes INTEGER DEFAULT 0,
    engagement_comments INTEGER DEFAULT 0,
    engagement_shares INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_linkedin_post_templates_active ON linkedin_post_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_linkedin_post_templates_category ON linkedin_post_templates(category);
CREATE INDEX IF NOT EXISTS idx_linkedin_post_templates_created_at ON linkedin_post_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_template_id ON linkedin_posts(template_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_status ON linkedin_posts(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_published_at ON linkedin_posts(published_at DESC);

-- Disable RLS (protected by Clerk middleware)
ALTER TABLE linkedin_post_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_posts DISABLE ROW LEVEL SECURITY;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_linkedin_post_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_linkedin_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_linkedin_post_templates_updated_at ON linkedin_post_templates;
CREATE TRIGGER trigger_update_linkedin_post_templates_updated_at
    BEFORE UPDATE ON linkedin_post_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_post_templates_updated_at();

DROP TRIGGER IF EXISTS trigger_update_linkedin_posts_updated_at ON linkedin_posts;
CREATE TRIGGER trigger_update_linkedin_posts_updated_at
    BEFORE UPDATE ON linkedin_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_posts_updated_at();

-- Trigger to increment usage_count when template is used
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE linkedin_post_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_template_usage ON linkedin_posts;
CREATE TRIGGER trigger_increment_template_usage
    AFTER INSERT ON linkedin_posts
    FOR EACH ROW
    EXECUTE FUNCTION increment_template_usage();

-- Comments
COMMENT ON TABLE linkedin_post_templates IS 'Admin-created LinkedIn post templates that SDRs can use';
COMMENT ON TABLE linkedin_posts IS 'LinkedIn posts made by SDRs, with optional template reference';
COMMENT ON COLUMN linkedin_post_templates.usage_count IS 'Auto-incremented when SDRs use this template';
COMMENT ON COLUMN linkedin_posts.template_id IS 'Optional reference to template if post was created from one';
