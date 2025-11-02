-- =====================================================
-- Migration 033: Update template category constraints
-- =====================================================
-- Date: 2025-11-02
-- Purpose: Add 'successful_call' and 'missed_call' categories to template constraints
-- Issue: Auto-send now differentiates between successful and missed calls,
--        but templates can't be updated because constraints only allow old categories
-- =====================================================

-- Drop old SMS templates category constraint
ALTER TABLE sms_templates
DROP CONSTRAINT IF EXISTS sms_templates_category_check;

-- Add new constraint with successful_call and missed_call categories
ALTER TABLE sms_templates
ADD CONSTRAINT sms_templates_category_check
CHECK (category IN (
    'follow_up',
    'appointment',
    'general',
    'post_call',
    'successful_call',  -- NEW: For templates sent after successful calls
    'missed_call'       -- NEW: For templates sent after missed/failed calls
));

-- Drop old Email templates category constraint
ALTER TABLE email_templates
DROP CONSTRAINT IF EXISTS email_templates_category_check;

-- Add new constraint with successful_call and missed_call categories
ALTER TABLE email_templates
ADD CONSTRAINT email_templates_category_check
CHECK (category IN (
    'follow_up',
    'appointment',
    'proposal',
    'general',
    'post_call',
    'successful_call',  -- NEW: For templates sent after successful calls
    'missed_call'       -- NEW: For templates sent after missed/failed calls
));

-- Add comments
COMMENT ON CONSTRAINT sms_templates_category_check ON sms_templates IS
'SMS template categories: follow_up, appointment, general, post_call (legacy), successful_call, missed_call';

COMMENT ON CONSTRAINT email_templates_category_check ON email_templates IS
'Email template categories: follow_up, appointment, proposal, general, post_call (legacy), successful_call, missed_call';
