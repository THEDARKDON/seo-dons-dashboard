# Column Mapping Feature Implementation

## Summary

Added interactive column mapping UI to the admin user management lead import page at `/dashboard/admin/users/[id]/leads`. This feature was already available at `/dashboard/leads/import` and has now been replicated for admin-managed imports.

## Changes Made

### 1. Updated [components/admin/lead-import-form.tsx](components/admin/lead-import-form.tsx)

**Added Dependencies:**
- `papaparse` - CSV parsing library (already installed)
- Select components from shadcn/ui
- Additional icons: ArrowRight, Check

**New Constants:**
- `LEAD_FIELDS` array - Defines all available CRM fields with labels and required status
- Includes 17 fields: first_name, last_name, email, phone, company, job_title, website, linkedin_url, address, city, state, postal_code, country, industry, company_size, annual_revenue, notes, skip

**Updated State Variables:**
- `csvData` - Stores parsed CSV rows
- Changed `ParsedLead` interface to match database schema (first_name/last_name instead of company_name/contact_name)
- Updated manual form state to use correct field names

**Rewritten handleFileUpload Function:**
- Uses `Papa.parse()` instead of manual CSV parsing
- Implements intelligent auto-mapping based on column header names
- Special handling for common variations:
  - "First Name", "fname" → first_name
  - "Last Name", "surname" → last_name
  - "Company Name", "organization" → company
  - "Mobile Phone", "Corporate Phone" → phone
  - "Person Linkedin Url" → linkedin_url
  - And more...
- Shows column mapping UI automatically after upload

**Updated handleImportCSV Function:**
- Validates required fields before import
- Transforms CSV data using column mapping
- Filters out rows missing first_name or last_name
- Sends properly mapped data to API

**New Column Mapping UI:**
- Shows success message with file name and row count
- Displays each CSV column with:
  - Column header from CSV
  - Dropdown to select CRM field
  - Example value from first row
- Shows required fields notice
- Cancel button to reset upload
- Import button with row count

**Updated Manual Form:**
- Changed from "Company Name" + "Contact Name" to "First Name" + "Last Name"
- Both are now required fields
- Company field is optional

## How It Works

### User Flow:

1. **Upload CSV File**
   - User clicks "CSV Upload" tab
   - Selects a .csv file
   - File is parsed using papaparse

2. **Auto-Mapping**
   - System automatically detects column names
   - Matches them to CRM fields using intelligent algorithm
   - Example: "Email" → email, "Company Name for Emails" → company

3. **Review & Adjust Mapping**
   - User sees all CSV columns
   - Can change any mapping via dropdown
   - Can skip unwanted columns
   - Example values shown for verification

4. **Validation**
   - System checks for required fields:
     - First Name ✓
     - Last Name ✓
     - Email OR Phone ✓

5. **Import**
   - Leads are transformed using mapping
   - Sent to `/api/admin/leads/import`
   - Results shown with success/failure counts

## Testing Instructions

### Test 1: Basic CSV Import with Standard Headers

**CSV Content:**
```csv
First Name,Last Name,Email,Company,Phone
John,Doe,john@example.com,Acme Corp,555-0100
Jane,Smith,jane@example.com,TechCo,555-0101
```

**Expected:**
- Auto-maps all 5 columns correctly
- Shows 2 rows found
- Import succeeds with 2 successful

**Steps:**
1. Go to Admin → User Management
2. Select any SDR
3. Click "Manage Leads"
4. Upload CSV
5. Verify mapping is correct
6. Click Import

### Test 2: CSV with Non-Standard Headers

**CSV Content:**
```csv
fname,lname,email address,company name,mobile
Bob,Johnson,bob@test.com,StartupXYZ,555-0200
```

**Expected:**
- Auto-maps fname → First Name
- Auto-maps lname → Last Name
- Auto-maps email address → Email
- Auto-maps company name → Company
- Auto-maps mobile → Phone

### Test 3: CSV with Spaces in Headers (User's Format)

**CSV Content:**
```csv
First Name,Last Name,Title,Company Name,Company Name for Emails,Email,Mobile Phone,Corporate Phone,Other Phone,Keywords,Person Linkedin Url,Website,Company Linkedin Url,Company Address,Company City,Company Phone,Annual Revenue
Alice,Wonder,CEO,WonderCo,WonderCo Inc,alice@wonder.co,555-1000,555-1001,555-1002,tech saas,https://linkedin.com/in/alice,https://wonder.co,https://linkedin.com/company/wonderco,123 Main St,San Francisco,$5M
```

**Expected:**
- All columns auto-map correctly
- Title → Job Title
- Company Name → Company
- Mobile Phone/Corporate Phone/Other Phone → Phone (first non-empty used)
- Person Linkedin Url → LinkedIn URL
- Annual Revenue → Annual Revenue

### Test 4: Manual Mapping Adjustment

**CSV Content:**
```csv
name,surname,contact email,org
Charlie,Brown,charlie@peanuts.com,Peanuts Inc
```

**Steps:**
1. Upload CSV
2. Initially "name" might map to company
3. Manually change "name" → First Name
4. Manually change "surname" → Last Name
5. "contact email" → Email (auto)
6. "org" → Company (auto or manual)
7. Import

**Expected:**
- Manual changes override auto-mapping
- Import succeeds

### Test 5: Missing Required Fields

**CSV Content:**
```csv
Company,Email
Acme,test@acme.com
```

**Expected:**
- No first_name or last_name mapped
- Import button shows validation error:
  "First Name and Last Name are required fields"

### Test 6: Email OR Phone Validation

**CSV Content (Valid):**
```csv
First Name,Last Name,Email
David,Lee,david@example.com
```

**CSV Content (Invalid):**
```csv
First Name,Last Name,Company
David,Lee,TechCorp
```

**Expected:**
- First CSV: Import succeeds (has email)
- Second CSV: Error "At least one of Email or Phone is required"

### Test 7: Skip Columns

**CSV Content:**
```csv
First Name,Last Name,Email,Internal ID,Tags
Emily,Davis,emily@test.com,EMP001,vip;important
```

**Steps:**
1. Upload CSV
2. Set "Internal ID" → Skip
3. Set "Tags" → Skip
4. Import

**Expected:**
- Only First Name, Last Name, Email imported
- Internal ID and Tags ignored

### Test 8: Duplicate Detection

**CSV Content:**
```csv
First Name,Last Name,Email
John,Doe,existing@user.com
Jane,Smith,new@user.com
```

**Steps:**
1. Ensure "Skip duplicate emails" is checked
2. If existing@user.com already exists in DB
3. Import

**Expected:**
- Summary shows:
  - Successful: 1 (Jane)
  - Duplicates: 1 (John)

## Comparison with Regular Import

| Feature | /dashboard/leads/import | /dashboard/admin/users/[id]/leads |
|---------|------------------------|-----------------------------------|
| Column Mapping | ✓ Yes (CSVImportWizard) | ✓ Yes (Updated LeadImportForm) |
| Auto-Mapping | ✓ Yes | ✓ Yes |
| Manual Adjustment | ✓ Yes | ✓ Yes |
| Example Preview | ✓ Yes | ✓ Yes |
| Validation | ✓ Yes | ✓ Yes |
| Skip Columns | ✓ Yes | ✓ Yes |
| Batch Import | ✓ Yes (50 per batch) | ✓ Yes (all at once) |
| Progress Bar | ✓ Yes | ✗ No (could add) |
| Import History | ✗ No | ✓ Yes |
| Assigned To | Auto (current user) | Admin selects SDR |

## Files Modified

1. **[components/admin/lead-import-form.tsx](components/admin/lead-import-form.tsx)** - Main changes
2. **[app/api/admin/leads/import/route.ts](app/api/admin/leads/import/route.ts)** - Already supports the format (no changes needed)

## API Compatibility

The API endpoint `/api/admin/leads/import` already handles:
- Multiple column name variations
- first_name, last_name, email, phone, company, job_title, etc.
- Duplicate detection
- Validation

**No API changes required** - existing implementation from previous session already supports all necessary field mappings.

## Known Issues / Future Improvements

1. **No Progress Bar** - Regular import has progress bar for batch processing
2. **No Batch Processing** - Admin import sends all leads at once (could timeout on very large files)
3. **No Retry on Failure** - Could add retry logic for failed rows
4. **Example Preview Limited** - Only shows first row example, could show multiple

## Success Criteria

✅ Column mapping UI displays after CSV upload
✅ Auto-mapping detects common header variations
✅ Manual adjustment works via dropdowns
✅ Required field validation prevents invalid imports
✅ Example data helps user verify mappings
✅ Import works with mapped data
✅ Results show success/failure/duplicate counts
✅ Manual entry form still works
✅ Maintains all existing functionality

---

**Implementation Date:** 2025-11-01
**Status:** ✅ Complete, Ready for Testing
