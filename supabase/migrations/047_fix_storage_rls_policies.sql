-- Migration 047: Fix Storage RLS Policies for Proposals Bucket
-- Allow authenticated API requests to upload and access proposal PDFs

-- Storage policies for 'proposals' bucket

-- Policy: Allow inserts (uploads) to proposals bucket
-- This allows the API to upload PDFs (API uses service role via anon key)
DROP POLICY IF EXISTS "Allow authenticated uploads to proposals bucket" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to proposals bucket"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'proposals');

-- Policy: Allow updates to proposals bucket
DROP POLICY IF EXISTS "Allow authenticated updates to proposals bucket" ON storage.objects;
CREATE POLICY "Allow authenticated updates to proposals bucket"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'proposals');

-- Policy: Allow selects (downloads) from proposals bucket
DROP POLICY IF EXISTS "Allow authenticated downloads from proposals bucket" ON storage.objects;
CREATE POLICY "Allow authenticated downloads from proposals bucket"
ON storage.objects FOR SELECT
TO authenticated, anon, public
USING (bucket_id = 'proposals');

-- Policy: Allow deletes from proposals bucket (admins only in future)
DROP POLICY IF EXISTS "Allow authenticated deletes from proposals bucket" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from proposals bucket"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'proposals');

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 047: Fixed storage RLS policies for proposals bucket';
  RAISE NOTICE 'Policies now allow authenticated and anon role access';
END $$;
