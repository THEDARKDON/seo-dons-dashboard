-- Add proposal_mode column to proposals table
ALTER TABLE proposals
ADD COLUMN proposal_mode text DEFAULT 'detailed'
CHECK (proposal_mode IN ('concise', 'detailed'));

-- Add comment for documentation
COMMENT ON COLUMN proposals.proposal_mode IS 'Proposal format mode - concise (5-6 pages) or detailed (10-12 pages)';

-- Update existing proposals to have the default mode
UPDATE proposals
SET proposal_mode = 'detailed'
WHERE proposal_mode IS NULL;