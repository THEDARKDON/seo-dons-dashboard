-- =====================================================
-- Migration 034: Add 'sending' status to sms_messages
-- =====================================================
-- Date: 2025-11-02
-- Purpose: Allow 'sending' status for SMS messages during auto-send
-- Issue: Auto-send tries to set status='sending' but constraint only allows:
--        'draft', 'queued', 'sent', 'delivered', 'failed', 'received'
-- =====================================================

-- Drop old constraint
ALTER TABLE sms_messages
DROP CONSTRAINT IF EXISTS sms_messages_status_check;

-- Add new constraint with 'sending' status
ALTER TABLE sms_messages
ADD CONSTRAINT sms_messages_status_check
CHECK (status IN (
    'draft',
    'queued',
    'sending',    -- NEW: Added for auto-send immediate processing
    'sent',
    'delivered',
    'failed',
    'received'
));

-- Add comment
COMMENT ON CONSTRAINT sms_messages_status_check ON sms_messages IS
'SMS message statuses: draft, queued, sending (in-progress), sent, delivered, failed, received';
