-- Check SMS template categories
SELECT 
  name,
  category,
  auto_send_after_call,
  is_active,
  LEFT(body, 50) as body_preview
FROM sms_templates
WHERE auto_send_after_call = true
ORDER BY category, name;

-- Check Email template categories
SELECT 
  name,
  category,
  auto_send_after_call,
  is_active,
  subject
FROM email_templates
WHERE auto_send_after_call = true
ORDER BY category, name;
