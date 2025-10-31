# Lead Import Error Fix - Summary

## Problem
When importing leads from CSV via the admin user management page, the request fails with:
```
POST /api/admin/leads/import 500 (Internal Server Error)
Error: Could not find the 'assigned_to' column of 'lead_imports' in the schema cache
Code: PGRST204
```

## Root Cause
The `lead_imports` table exists in the database but is **missing the `assigned_to` column**.

### Current Table Structure
The table has these columns:
- id
- file_name
- file_size
- import_source
- total_rows
- successful_imports
- failed_imports
- duplicate_skipped
- status
- imported_by
- started_at
- completed_at
- column_mapping
- duplicate_handling
- error_log
- notes

### Expected Column (Missing)
- `assigned_to` UUID - Which SDR the imported leads should be assigned to

## Why This Happened
The table was likely created with an older migration before the `assigned_to` column was added to the schema. Migration `023_lead_import_system.sql` includes this column, but the production database has an older version of the table.

## Solution

### Quick Fix (Recommended)
Run this SQL in the Supabase SQL Editor:

```sql
-- Add assigned_to column
ALTER TABLE lead_imports
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);

-- Add comment
COMMENT ON COLUMN lead_imports.assigned_to IS 'Which SDR these leads were assigned to';
```

### Access SQL Editor
1. Go to: https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new
2. Paste the SQL above
3. Click "Run"

### Alternative: Use Pre-made Script
A complete SQL script is available at:
- `FIX_LEAD_IMPORTS_ADD_ASSIGNED_TO.sql`

This includes the ALTER TABLE statement plus verification queries.

## Files Created for Diagnosis
1. `APPLY_LEAD_IMPORT_MIGRATION.sql` - Full migration (if table needs to be recreated)
2. `FIX_LEAD_IMPORTS_ADD_ASSIGNED_TO.sql` - Quick fix to add missing column
3. `scripts/check-table-columns.ts` - Diagnostic script to check table structure
4. `scripts/add-assigned-to-column.ts` - Shows current state and instructions

## Verification
After running the SQL, verify the column was added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lead_imports'
  AND column_name = 'assigned_to';
```

Should return:
```
column_name  | data_type | is_nullable
assigned_to  | uuid      | YES
```

## Test Import
After adding the column, test the import feature:
1. Go to Admin → User Management
2. Select an SDR
3. Click "Import Leads"
4. Upload a CSV file
5. Should succeed without errors

## Code Reference
The API endpoint expecting this column:
- File: [`app/api/admin/leads/import/route.ts`](app/api/admin/leads/import/route.ts:40)
- Line 40: `assigned_to: assignedToUserId,`

---

**Status:** Diagnosed, fix SQL ready to apply
**Impact:** HIGH - Admins cannot import leads for SDRs
**Priority:** HIGH - Core functionality broken
