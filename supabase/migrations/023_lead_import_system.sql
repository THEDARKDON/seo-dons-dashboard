-- Lead Import System
-- Allows admins to bulk import leads and track import history

-- Table to track import batches
CREATE TABLE IF NOT EXISTS lead_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imported_by UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Which SDR these leads were assigned to

    -- Import details
    import_type TEXT CHECK (import_type IN ('csv', 'manual', 'api')) NOT NULL,
    file_name TEXT, -- Original CSV file name if applicable
    file_url TEXT, -- URL to stored file

    -- Statistics
    total_rows INTEGER DEFAULT 0,
    successful_imports INTEGER DEFAULT 0,
    failed_imports INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,

    -- Status
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message TEXT,

    -- Import settings
    settings JSONB DEFAULT '{}'::jsonb, -- Skip duplicates, update existing, etc.

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track individual lead import results
CREATE TABLE IF NOT EXISTS lead_import_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID REFERENCES lead_imports(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- NULL if import failed

    -- Original data from import
    row_number INTEGER,
    raw_data JSONB, -- Original row data

    -- Result
    status TEXT CHECK (status IN ('success', 'failed', 'duplicate', 'skipped')) NOT NULL,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add import tracking to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS import_id UUID REFERENCES lead_imports(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_imports_imported_by ON lead_imports(imported_by);
CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_imports_status ON lead_imports(status);
CREATE INDEX IF NOT EXISTS idx_lead_imports_created_at ON lead_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_import_results_import_id ON lead_import_results(import_id);
CREATE INDEX IF NOT EXISTS idx_lead_import_results_status ON lead_import_results(status);
CREATE INDEX IF NOT EXISTS idx_leads_import_id ON leads(import_id);

-- Disable RLS (protected by Clerk middleware)
ALTER TABLE lead_imports DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_import_results DISABLE ROW LEVEL SECURITY;

-- Function to update import statistics
CREATE OR REPLACE FUNCTION update_import_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lead_imports
    SET
        successful_imports = (
            SELECT COUNT(*) FROM lead_import_results
            WHERE import_id = NEW.import_id AND status = 'success'
        ),
        failed_imports = (
            SELECT COUNT(*) FROM lead_import_results
            WHERE import_id = NEW.import_id AND status = 'failed'
        ),
        duplicate_count = (
            SELECT COUNT(*) FROM lead_import_results
            WHERE import_id = NEW.import_id AND status = 'duplicate'
        )
    WHERE id = NEW.import_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_import_statistics ON lead_import_results;
CREATE TRIGGER trigger_update_import_statistics
    AFTER INSERT ON lead_import_results
    FOR EACH ROW
    EXECUTE FUNCTION update_import_statistics();

-- Function to auto-complete import when all rows processed
CREATE OR REPLACE FUNCTION check_import_completion()
RETURNS TRIGGER AS $$
DECLARE
    import_record RECORD;
BEGIN
    SELECT * INTO import_record FROM lead_imports WHERE id = NEW.import_id;

    IF import_record.total_rows > 0 AND
       (import_record.successful_imports + import_record.failed_imports + import_record.duplicate_count) >= import_record.total_rows THEN
        UPDATE lead_imports
        SET
            status = 'completed',
            completed_at = NOW()
        WHERE id = NEW.import_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_import_completion ON lead_import_results;
CREATE TRIGGER trigger_check_import_completion
    AFTER INSERT ON lead_import_results
    FOR EACH ROW
    EXECUTE FUNCTION check_import_completion();

-- Comments
COMMENT ON TABLE lead_imports IS 'Tracks bulk lead import batches with statistics';
COMMENT ON TABLE lead_import_results IS 'Individual results for each lead in an import batch';
COMMENT ON COLUMN leads.import_id IS 'Links lead to the import batch it came from';
COMMENT ON COLUMN lead_imports.settings IS 'Import configuration: skip_duplicates, update_existing, etc.';
