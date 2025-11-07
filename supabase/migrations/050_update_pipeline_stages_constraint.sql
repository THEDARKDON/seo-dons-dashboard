-- Script to update the deals table stage constraint
-- Run this FIRST if you get constraint violation errors

-- Drop the existing check constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Add the new check constraint with all stage values (both old and new)
-- This allows both old and new stages to coexist during migration
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (
    stage IN (
        -- New stages
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
        'dead_lead',
        -- Old stages (kept temporarily for compatibility)
        'prospecting',
        'qualification',
        'proposal',
        'negotiation'
    )
);

-- Verify current stages in use
SELECT DISTINCT stage, COUNT(*) as count
FROM deals
GROUP BY stage
ORDER BY stage;