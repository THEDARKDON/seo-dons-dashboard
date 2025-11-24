-- =====================================================
-- Migration 032: Add 'sending' status to email_messages
-- =====================================================
-- Date: 2025-11-02
-- Purpose: Allow 'sending' status for email messages during auto-send
-- Issue: Auto-send tries to set status='sending' but constraint only allows:
--        'draft', 'queued', 'sent', 'delivered', 'failed', 'received'
-- =====================================================

-- Drop old constraint
ALTER TABLE email_messages
DROP CONSTRAINT IF EXISTS email_messages_status_check;

-- Add new constraint with 'sending' status
ALTER TABLE email_messages
ADD CONSTRAINT email_messages_status_check
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
COMMENT ON CONSTRAINT email_messages_status_check ON email_messages IS
'Email message statuses: draft, queued, sending (in-progress), sent, delivered, failed, received';
