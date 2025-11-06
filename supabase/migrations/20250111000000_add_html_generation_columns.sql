-- Add HTML-first generation workflow columns to proposals table
-- This enables: HTML generation → preview/edit → PDF conversion

-- Add columns for HTML content and generation tracking
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS html_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS generation_stage VARCHAR(20) DEFAULT 'research',
ADD COLUMN IF NOT EXISTS html_url TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for faster queries by generation_stage
CREATE INDEX IF NOT EXISTS idx_proposals_generation_stage ON proposals(generation_stage);

-- Add comment explaining generation stages
COMMENT ON COLUMN proposals.generation_stage IS 'Possible values: research, content, html_ready, pdf_ready, error';

-- Update status check constraint to include 'html_ready' and 'error'
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check CHECK (status IN (
    'draft',        -- Initial state
    'generating',   -- Claude is working
    'html_ready',   -- HTML generated, ready for review/edit (NEW)
    'ready',        -- PDF generated, ready to send
    'sent',         -- Sent to customer
    'viewed',       -- Customer opened PDF
    'accepted',     -- Customer accepted
    'rejected',     -- Customer declined
    'error'         -- Generation failed (NEW)
));

-- Update existing proposals to have correct generation_stage
UPDATE proposals
SET generation_stage = CASE
  WHEN status = 'ready' AND pdf_url IS NOT NULL THEN 'pdf_ready'
  WHEN status = 'generating' THEN 'research'
  WHEN status = 'error' THEN 'error'
  ELSE 'research'
END
WHERE generation_stage IS NULL OR generation_stage = 'research';

-- Set pdf_generated_at for existing completed proposals
UPDATE proposals
SET pdf_generated_at = updated_at
WHERE status = 'ready' AND pdf_url IS NOT NULL AND pdf_generated_at IS NULL;

-- Set html_generated_at for existing proposals with HTML URLs
UPDATE proposals
SET html_generated_at = updated_at
WHERE html_url IS NOT NULL AND html_generated_at IS NULL;
