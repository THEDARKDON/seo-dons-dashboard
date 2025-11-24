-- Add template_style column to proposals table
-- Migration: 007_add_template_style
-- Created: 2025-01-08
-- Purpose: Support modern vs classic proposal templates

-- Add template_style column (defaults to 'classic' for backward compatibility)
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classic';

-- Add check constraint to ensure only valid values
ALTER TABLE proposals
ADD CONSTRAINT proposals_template_style_check
CHECK (template_style IN ('classic', 'modern'));

-- Create index for faster filtering by template style
CREATE INDEX IF NOT EXISTS proposals_template_style_idx ON proposals(template_style);

-- Update existing proposals to use classic template
UPDATE proposals
SET template_style = 'classic'
WHERE template_style IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN proposals.template_style IS 'Template style: classic (traditional PDF-style) or modern (web-first with videos)';
