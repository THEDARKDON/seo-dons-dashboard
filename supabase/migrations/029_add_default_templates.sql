-- Add default SMS templates for auto-sending after calls
INSERT INTO sms_templates (name, content, category, is_active, auto_send_after_call, auto_send_delay_minutes, created_by)
SELECT
  'Successful Call Follow-up',
  'Hi {first_name}, thank you for speaking with SEO Dons today! We''re excited to help grow your business. Visit our website for more information: https://www.seodons.com',
  'post_call_success',
  true,
  true,
  5, -- Send 5 minutes after call
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Successful Call Follow-up'
);

INSERT INTO sms_templates (name, content, category, is_active, auto_send_after_call, auto_send_delay_minutes, created_by)
SELECT
  'Missed Call Follow-up',
  'Hi {first_name}, we tried to reach you at SEO Dons but couldn''t connect. Please call us back at your convenience or reply to this message. Looking forward to speaking with you!',
  'post_call_failed',
  true,
  true,
  2, -- Send 2 minutes after failed call
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM sms_templates WHERE name = 'Missed Call Follow-up'
);

-- Add default Email templates for auto-sending after calls
INSERT INTO email_templates (name, subject, content, category, is_active, auto_send_after_call, created_by)
SELECT
  'Successful Call Follow-up Email',
  'Great speaking with you, {first_name}!',
  '<p>Hi {first_name},</p>

<p>Thank you for taking the time to speak with me today at SEO Dons. It was great learning more about your business and discussing how we can help you achieve your goals.</p>

<p><strong>Key points from our conversation:</strong></p>
<ul>
<li>Custom SEO strategy tailored to your industry</li>
<li>Transparent reporting and regular updates</li>
<li>Proven track record of delivering results</li>
</ul>

<p><strong>Next Steps:</strong></p>
<ol>
<li>Review the proposal we discussed</li>
<li>Schedule a follow-up call if needed</li>
<li>Let us know if you have any questions</li>
</ol>

<p>Learn more about our services: <a href="https://www.seodons.com">www.seodons.com</a></p>

<p>Looking forward to working together!</p>

<p>Best regards,<br>
The SEO Dons Team</p>',
  'post_call_success',
  true,
  true,
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE name = 'Successful Call Follow-up Email'
);

INSERT INTO email_templates (name, subject, content, category, is_active, auto_send_after_call, created_by)
SELECT
  'Missed Call Follow-up Email',
  'We tried to reach you - SEO Dons',
  '<p>Hi {first_name},</p>

<p>We tried to call you today at SEO Dons but weren''t able to connect. We understand you''re busy, and we''d love to find a better time to speak with you.</p>

<p><strong>What we wanted to discuss:</strong></p>
<ul>
<li>How SEO Dons can help grow your online presence</li>
<li>Custom strategies for your specific business needs</li>
<li>Transparent pricing with no hidden fees</li>
</ul>

<p><strong>Let''s reschedule:</strong></p>
<p>Reply to this email with your preferred time, or visit our website to schedule a call at your convenience: <a href="https://www.seodons.com">www.seodons.com</a></p>

<p>We''re here to help you succeed!</p>

<p>Best regards,<br>
The SEO Dons Team</p>',
  'post_call_failed',
  true,
  true,
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE name = 'Missed Call Follow-up Email'
);

-- Update template categories to support success/failed distinction
COMMENT ON COLUMN sms_templates.category IS 'Template category: general, post_call, post_call_success, post_call_failed';
COMMENT ON COLUMN email_templates.category IS 'Template category: general, post_call, post_call_success, post_call_failed';
