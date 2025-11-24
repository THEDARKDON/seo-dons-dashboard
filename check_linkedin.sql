-- Check if user_integrations exists for this user
SELECT 
    ui.id,
    ui.user_id,
    ui.provider,
    ui.provider_user_id,
    ui.scopes,
    ui.metadata,
    ui.created_at,
    u.email as user_email,
    u.clerk_id
FROM user_integrations ui
JOIN users u ON u.id = ui.user_id
WHERE ui.user_id = '79c6cca6-baa1-404c-a10f-237b10b9a244'
  AND ui.provider = 'google';

-- Also check if there's a user with this ID
SELECT id, email, clerk_id, first_name, last_name
FROM users
WHERE id = '79c6cca6-baa1-404c-a10f-237b10b9a244';
