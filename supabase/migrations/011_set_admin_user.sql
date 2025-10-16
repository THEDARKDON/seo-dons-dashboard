-- Set the first user to admin role
UPDATE users
SET role = 'admin'
WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1);
