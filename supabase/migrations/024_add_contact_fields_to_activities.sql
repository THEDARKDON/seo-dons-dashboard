-- Add contact name and email to activities table
-- This allows storing contact information even without a customer_id

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Create index for contact_email lookups
CREATE INDEX IF NOT EXISTS idx_activities_contact_email ON activities(contact_email);

-- Comment
COMMENT ON COLUMN activities.contact_name IS 'Contact name when customer_id is not available';
COMMENT ON COLUMN activities.contact_email IS 'Contact email when customer_id is not available';
