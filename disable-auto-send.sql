-- Disable all automated SMS messages
UPDATE sms_templates
SET is_active = false
WHERE auto_send_after_call = true;

-- Disable all automated Email messages
UPDATE email_templates
SET is_active = false
WHERE auto_send_after_call = true;

-- Verify the changes
SELECT 'SMS Templates' as type, name, is_active, auto_send_after_call
FROM sms_templates
WHERE auto_send_after_call = true
UNION ALL
SELECT 'Email Templates' as type, name, is_active, auto_send_after_call
FROM email_templates
WHERE auto_send_after_call = true;
