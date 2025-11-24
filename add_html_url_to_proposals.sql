-- Add html_url column to proposals table
-- This stores the URL to the HTML version of the proposal

ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS html_url TEXT;

COMMENT ON COLUMN proposals.html_url IS 'URL to the HTML version of the proposal for web viewing';
