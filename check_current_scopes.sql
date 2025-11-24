-- Check what scopes are currently stored for your Google integration
SELECT 
    u.email as user_email,
    ui.provider,
    ui.scopes as current_scopes,
    ui.created_at as connected_at,
    ui.updated_at as last_updated
FROM user_integrations ui
JOIN users u ON u.id = ui.user_id
WHERE ui.provider = 'google'
ORDER BY ui.updated_at DESC;
