-- Migration script to update existing deal stages to the new pipeline stages
-- Run this script in your Supabase SQL editor

-- IMPORTANT: First, we need to handle the check constraint on the deals table
-- Drop the existing check constraint if it exists
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- First, let's backup the current stages (optional but recommended)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_backup text;
UPDATE deals SET stage_backup = stage WHERE stage_backup IS NULL;

-- Map old stages to new stages
UPDATE deals
SET stage = CASE
    -- Map old stages to new stages
    WHEN stage = 'prospecting' THEN 'new_leads_call'
    WHEN stage = 'qualification' THEN 'called_more_action'
    WHEN stage = 'proposal' THEN 'proposal_sent'
    WHEN stage = 'negotiation' THEN 'fup_call_booked'
    -- Keep these stages as-is since they exist in both
    WHEN stage = 'closed_won' THEN 'closed_won'
    WHEN stage = 'closed_lost' THEN 'closed_lost'
    -- Default mapping for any other values
    ELSE 'new_leads_call'
END
WHERE stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Now add a new check constraint with all the new stage values
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (
    stage IN (
        'new_leads_call',
        'called_no_answer',
        'called_more_action',
        'meeting_booked',
        'meeting_rescheduled',
        'meeting_cancelled',
        'proposal_sent',
        'fup_call_booked',
        'closed_won',
        'closed_lost',
        'dead_lead'
    )
);

-- Verify the migration
SELECT
    stage,
    COUNT(*) as count
FROM deals
GROUP BY stage
ORDER BY stage;

-- If you need to rollback (only works if you created the backup column):
-- UPDATE deals SET stage = stage_backup WHERE stage_backup IS NOT NULL;
-- ALTER TABLE deals DROP COLUMN stage_backup;