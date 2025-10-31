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

### Part 1: Database Changes (SQL)
Run this SQL in the Supabase SQL Editor:

```sql
-- Add missing columns
ALTER TABLE lead_imports
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_imports_assigned_to ON lead_imports(assigned_to);

-- Add comments
COMMENT ON COLUMN lead_imports.assigned_to IS 'Which SDR these leads were assigned to';
COMMENT ON COLUMN lead_imports.settings IS 'Import configuration: skip_duplicates, update_existing, etc.';
```

### Part 2: Code Changes (Already Fixed)
✅ Updated API to use `import_source` instead of `import_type`
- File: `app/api/admin/leads/import/route.ts:41`
- This fix is included in the next deployment

### Access SQL Editor
1. Go to: https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new
2. Paste the SQL above
3. Click "Run"

### Alternative: Use Pre-made Script
Two SQL scripts are available:
- `FIX_LEAD_IMPORTS_COMPLETE.sql` - Complete fix with both columns (RECOMMENDED)
- `FIX_LEAD_IMPORTS_ADD_ASSIGNED_TO.sql` - Only adds assigned_to (partial fix)

Both include verification queries and test statements.

## Files Created
1. **`FIX_LEAD_IMPORTS_COMPLETE.sql`** ⭐ - Complete fix (RECOMMENDED)
2. `FIX_LEAD_IMPORTS_ADD_ASSIGNED_TO.sql` - Partial fix (only assigned_to)
3. `APPLY_LEAD_IMPORT_MIGRATION.sql` - Full migration (if table needs recreating)
4. `scripts/check-table-columns.ts` - Diagnostic tool
5. `scripts/map-lead-imports-columns.ts` - Column mapping analysis
6. `scripts/add-assigned-to-column.ts` - Instructions helper

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
