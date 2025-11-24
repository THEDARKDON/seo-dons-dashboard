-- Add reference_images column to customers table
-- Stores uploaded screenshots (SEMrush, competitor analysis, etc.) for Claude to analyze

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS reference_images JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_customers_reference_images ON customers USING GIN (reference_images);

-- Add comment explaining the structure
COMMENT ON COLUMN customers.reference_images IS 'Array of reference images (screenshots, reports) stored as base64 with metadata. Example: [{"name": "semrush-report.png", "type": "image/png", "data": "base64...", "description": "SEMrush competitor analysis", "uploaded_at": "2025-01-11T..."}]';

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 048: Added reference_images column to customers table';
  RAISE NOTICE 'This enables uploading SEMrush screenshots and other reference images for Claude analysis';
END $$;
