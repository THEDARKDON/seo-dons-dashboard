# Recent Feature Updates

## Summary of Changes

This document covers three major feature enhancements:

### 1. ✅ UK Phone Number Normalization (E.164 Format)
Fixes calling issues with UK non-geographic numbers like 0333, 0800, etc.

### 2. ✅ SDR Assignment in Deal Creation
Allows assigning deals to any SDR when creating them from customer or deals page.

### 3. ✅ Smart Duplicate Lead Updates (NEW)
When importing leads with duplicate emails, automatically updates ALL fields with new information instead of skipping them.

---

## Feature 1: UK Phone Number Normalization

### The Problem
UK non-geographic numbers (0333, 0800, 0845, etc.) were failing because Twilio requires phone numbers in **E.164 international format**.

**Before:**
- Input: `0333 339 9808`
- Sent to Twilio: `0333 339 9808` ❌ (Invalid - missing country code)
- Result: Call fails with Twilio error

**After:**
- Input: `0333 339 9808`
- Normalized to: `+443333399808` ✅ (Valid E.164 format)
- Result: Call succeeds

### What is E.164 Format?
E.164 is the international phone number standard:
- Format: `+[country code][number]`
- UK Example: `+44` + `333339980 8` = `+443333399808`
- US Example: `+1` + `4155551234` = `+14155551234`

### How It Works Now

When you click "Call" on any lead/customer:

1. **Phone Number Input:** `0333 339 9808`
2. **Automatic Normalization:**
   - Removes formatting (spaces, dashes, parentheses)
   - Detects country (defaults to GB/UK)
   - Converts to E.164: `+443333399808`
3. **Logging (in console):**
   ```
   [CallContext] Normalized phone: 0333 339 9808 → +443333399808
   ```
4. **Call proceeds with correct format**

### Supported Number Types

#### UK Numbers
- **Mobile:** 07xxx → +447xxx
- **Geographic:** 01xxx, 02xxx → +441xxx, +442xxx
- **Non-Geographic:** 0333, 0343, 0345, 0370, 0371 → +44333, +44343, etc.
- **Freephone:** 0800, 0808 → +44800, +44808
- **Special:** 0843, 0844, 0845, 0870, 0871, 0872, 0873 → +44843, etc.

#### International Numbers
- Already in E.164 (starting with +): Passed through as-is
- Other countries: Automatically normalized based on country code

### Error Handling

If a number is invalid:
- **Error Toast:** "Invalid phone number format: [number]. Expected format: UK (0333 123 4567), US (+1 415 555 1234), or E.164 (+441234567890)"
- **Call doesn't proceed** (prevents wasted attempts)
- **Console logging** for debugging

### Technical Implementation

Created [lib/utils/phone.ts](lib/utils/phone.ts:1) with these functions:

```typescript
// Main normalization function
normalizePhoneNumber(phoneNumber, defaultCountry = 'GB'): string

// Display formatting (for UI)
formatPhoneNumberForDisplay(phoneNumber, defaultCountry = 'GB'): string

// Validation
isValidPhone(phoneNumber, defaultCountry = 'GB'): boolean

// Get country code from number
getCountryCode(phoneNumber): string | undefined

// Check if UK non-geographic
isUKNonGeographic(phoneNumber): boolean

// Batch normalize multiple numbers
normalizePhoneNumbers(phoneNumbers[], defaultCountry = 'GB'): Array
```

### Where It's Used

- **CallContext:** All outbound calls are normalized before connecting
- **Future:** Can be used for SMS, lead import, customer creation, etc.

---

## Feature 2: SDR Assignment in Deal Creation

### The Problem
When creating deals from the customer page or deals page, they were always assigned to the current user. SDRs couldn't assign deals to other team members, making it hard to distribute work.

### The Solution
Added an "Assign To" dropdown in the deal creation modal that shows all users (SDRs and admins).

### How It Works

1. **Open Deal Creation Modal**
   - From customer page: Click "Create Deal" or "Create First Deal"
   - From deals page: Click "New Deal"

2. **See New "Assign To" Field**
   - Located at the top of the form (below Deal Name)
   - Dropdown showing all users: "First Last (role)"
   - Defaults to current user
   - Can select any other SDR or admin

3. **Create the Deal**
   - Deal is assigned to the selected user
   - Shows in that user's pipeline
   - Appears in their deal list

### User Display Format

Dropdown shows:
```
John Smith (admin)
Sarah Johnson (sdr)
Mike Davis (sdr)
```

### Default Behavior

- **Default:** Current logged-in user (you)
- **Can change:** To any other user in the dropdown
- **Required:** Must select someone (can't create unassigned deal)

### Pipeline Visibility

When you assign a deal to another SDR:
- **Their Pipeline:** Deal appears in their /dashboard/deals and /dashboard/pipeline
- **Their Leaderboard:** If they close it, it counts toward their revenue
- **Your View (if admin):** You can still see all deals via admin panel

### Example Use Cases

1. **Manager assigning deal to SDR:**
   - Customer calls in → Manager creates deal → Assigns to best-fit SDR

2. **SDR handing off deal:**
   - SDR qualifies lead → Creates deal → Assigns to closer

3. **Load balancing:**
   - Admin distributes inbound leads → Assigns deals evenly across team

### Technical Details

- Loads users via Supabase query: `users` table, ordered by `first_name`
- Shows all roles (admin, sdr, manager, etc.)
- Uses `assigned_to` field (UUID) to store assignment
- Dropdown is disabled while loading users ("Loading users...")

---

## Feature 3: Smart Duplicate Lead Updates

### The Problem
When importing CSV files with leads that already exist in the system (duplicate emails), the system was only updating the `category` field. All other new information (phone numbers, company details, job titles, etc.) was being ignored and lost.

**Before:**
- Import CSV with duplicate email but new phone number
- Result: Phone number ignored, only category updated
- All other updated fields lost

**After:**
- Import CSV with duplicate email and new information
- Result: ALL non-empty fields are updated on the existing lead
- Nothing is lost - complete merge of new data

### How It Works

When you import a CSV file and a lead with the same email already exists:

1. **System detects duplicate** (by email address)
2. **Scans all fields in the import** for new/updated information
3. **Updates existing lead** with ALL non-empty fields from the import
4. **Logs the changes** showing exactly which fields were updated
5. **Reports results** in the import summary

### Supported Fields

All these fields are now updated when importing duplicates:

#### Personal Information
- `first_name` (First Name, firstName)
- `last_name` (Last Name, lastName)
- `email` (Email)
- `phone` (Phone, Mobile Phone, Corporate Phone, phone_number)

#### Company Information
- `company` (Company, Company Name, company_name)
- `job_title` (Job Title, Title, position)
- `website` (Website, company_website)
- `linkedin_url` (LinkedIn, Person Linkedin Url)

#### Location Details
- `address` (Address, Company Address)
- `city` (City, Company City)
- `state` (State, region)
- `postal_code` (Postal Code, zip, postcode)
- `country` (Country)

#### Business Data
- `industry` (Industry)
- `company_size` (Company Size, employees)
- `annual_revenue` (Annual Revenue, revenue)

#### Metadata
- `notes` (Notes, comments, Keywords)
- `category` (Category)
- `lead_source` (Source, lead_source)
- `lead_source_details` (automatically set to filename)

### CSV Column Name Support

The system is smart about CSV column headers and recognizes multiple variations:

```csv
# All these are recognized as first_name:
First Name, first_name, firstName

# All these are recognized as phone:
Phone, phone, Mobile Phone, Corporate Phone, phone_number, phoneNumber

# All these are recognized as company:
Company, company, Company Name, company_name, Company Name for Emails
```

### Example Scenarios

#### Scenario 1: Update Phone Number
**Existing Lead:**
- Email: john@example.com
- Phone: (empty)
- Company: Acme Corp

**Import CSV:**
```csv
Email,Phone,Company
john@example.com,+44 333 339 9808,Acme Corp
```

**Result:**
- Duplicate detected
- Phone updated: `+44 333 339 9808`
- Company unchanged (same value)
- Console log: "Updating duplicate lead 123 with fields: phone"
- Import summary: "1 duplicate - updated fields: phone"

#### Scenario 2: Multiple Field Updates
**Existing Lead:**
- Email: sarah@company.com
- Phone: 01234567890
- Company: Old Company Ltd
- Job Title: (empty)
- LinkedIn: (empty)

**Import CSV:**
```csv
Email,Phone,Company,Job Title,LinkedIn
sarah@company.com,07700900123,New Company Ltd,Senior Manager,linkedin.com/in/sarah
```

**Result:**
- Duplicate detected
- Updated fields:
  - phone: `07700900123`
  - company: `New Company Ltd`
  - job_title: `Senior Manager`
  - linkedin_url: `linkedin.com/in/sarah`
- Console log: "Updating duplicate lead 456 with fields: phone, company, job_title, linkedin_url"
- Import summary: "1 duplicate - updated fields: phone, company, job_title, linkedin_url"

#### Scenario 3: No New Data
**Existing Lead:**
- Email: mike@test.com
- Phone: 07700900123
- Company: Test Co

**Import CSV:**
```csv
Email,Phone,Company
mike@test.com,07700900123,Test Co
```

**Result:**
- Duplicate detected
- No fields updated (all values identical)
- Console log: "No new data to update for duplicate lead"
- Import summary: "1 duplicate - no new data to update"

### Where It Works

This smart update logic works in:

1. **Admin Lead Import** ([app/api/admin/leads/import/route.ts](app/api/admin/leads/import/route.ts))
   - Accessible from Admin panel
   - Bulk import with user assignment

2. **User Lead Import** ([app/api/leads/import/route.ts](app/api/leads/import/route.ts))
   - Accessible from Leads page
   - Personal lead imports

Both routes use identical logic for consistency.

### Console Logging

When duplicates are updated, you'll see detailed console logs:

```
Processing lead 5: { email: 'john@example.com', category: 'hot-lead', has_category: true }
Updating duplicate lead d4f2b3e8-1234-5678-abcd-ef1234567890 with fields: phone, company, job_title
Successfully updated 3 fields for duplicate lead
```

This helps you verify exactly what's being updated.

### Import Results Display

The import summary now shows which fields were updated:

```
Import Summary:
✅ Successfully imported: 45 leads
⚠️  Duplicates found: 12 leads
   - 8 duplicates updated with new information
   - 4 duplicates had no new data
❌ Failed: 2 leads (see error log)

Duplicate Details:
- Row 5: Email already exists - updated fields: phone, company
- Row 12: Email already exists - updated fields: job_title, linkedin_url, notes
- Row 18: Email already exists - no new data to update
```

### Technical Implementation

**Field Mapping Object:**
```typescript
const fieldMappings: Record<string, () => any> = {
  first_name: () => lead.first_name || lead.firstName || lead['First Name'],
  phone: () => lead.phone || lead.Phone || lead.phone_number,
  company: () => lead.company || lead.Company || lead['Company Name'],
  // ... all other fields
};
```

**Update Logic:**
```typescript
const updateData: any = {};
const updatedFields: string[] = [];

// Check each field
for (const [fieldName, getter] of Object.entries(fieldMappings)) {
  const value = getter();
  if (value !== null && value !== undefined && value !== '') {
    updateData[fieldName] = value;
    updatedFields.push(fieldName);
  }
}

// Only update if we have new data
if (Object.keys(updateData).length > 0) {
  await supabase
    .from('leads')
    .update(updateData)
    .eq('id', existingLead.id);
}
```

### Benefits

1. **No Data Loss** - All new information is preserved and merged
2. **Intelligent Merging** - Only updates fields that have values
3. **Flexible CSV Formats** - Recognizes many column name variations
4. **Transparent Logging** - See exactly what's being updated
5. **Detailed Reporting** - Import summary shows all updates
6. **Safe Updates** - Doesn't overwrite with empty values

### Migration Path

**Old Behavior:**
- Only category field updated
- All other new data lost
- No visibility into what changed

**New Behavior:**
- All non-empty fields updated
- Complete data merge
- Full logging and reporting

**No Action Required:**
- Feature is automatically active
- Works with existing CSV files
- No database changes needed

---

## Testing Instructions

### Test UK Phone Normalization

1. **Find a lead with UK non-geographic number:**
   - Example: 0333 339 9808

2. **Click "Call" button**

3. **Open browser console (F12)**

4. **Look for log:**
   ```
   [CallContext] Normalized phone: 0333 339 9808 → +443333399808
   ```

5. **Call should connect successfully**

6. **Test different formats:**
   - `0333 339 9808` (spaces)
   - `0333-339-9808` (dashes)
   - `(0333) 339 9808` (parentheses)
   - `+443333399808` (already E.164)
   - All should work!

### Test SDR Assignment

1. **Go to a customer page**

2. **Click "Create Deal"**

3. **Check "Assign To" dropdown:**
   - Should show all users
   - Should default to you

4. **Select a different SDR**

5. **Fill in deal details and create**

6. **Verify:**
   - Deal created successfully
   - Toast: "Deal created successfully!"
   - Check that SDR's pipeline → deal should appear there

7. **Test from deals page:**
   - Go to /dashboard/deals
   - Click "New Deal"
   - Should also have "Assign To" dropdown
   - Create deal assigned to another SDR
   - Verify it appears in their list

### Test Duplicate Lead Updates

1. **Setup: Create an existing lead**
   - Go to Leads page
   - Create a lead manually:
     - Email: test@example.com
     - First Name: John
     - Company: Old Company
     - Phone: (leave empty)

2. **Test: Import duplicate with new info**
   - Create CSV file:
     ```csv
     Email,First Name,Last Name,Company,Phone,Job Title
     test@example.com,John,Doe,New Company Ltd,07700900123,Senior Manager
     ```
   - Import the CSV
   - Open browser console (F12)

3. **Verify:**
   - Check console logs:
     ```
     Processing lead 1: { email: 'test@example.com', ... }
     Updating duplicate lead [uuid] with fields: last_name, company, phone, job_title
     Successfully updated 4 fields for duplicate lead
     ```
   - Import summary should show:
     ```
     Duplicates: 1
     - Email already exists - updated fields: last_name, company, phone, job_title
     ```
   - Check the lead in database:
     - Last Name: "Doe" (NEW)
     - Company: "New Company Ltd" (UPDATED)
     - Phone: "07700900123" (NEW)
     - Job Title: "Senior Manager" (NEW)

4. **Test: Import duplicate with no new data**
   - Import same CSV again
   - Should see: "No new data to update for duplicate lead"
   - Import summary: "Email already exists - no new data to update"

5. **Test: Multiple column name formats**
   - Create CSV with alternative headers:
     ```csv
     Email,firstName,Company Name,Mobile Phone,Title
     test@example.com,Jane,Another Corp,07700900456,Director
     ```
   - Should recognize all columns correctly
   - Should update: first_name, company, phone, job_title

### Edge Cases to Test

1. **Invalid phone number:**
   - Try calling: "12345" (invalid)
   - Should show error toast
   - Call shouldn't connect

2. **International number:**
   - Try: +1 415 555 1234 (US)
   - Should normalize correctly
   - Call should work if Twilio account supports US calls

3. **No SDR selected:**
   - Open deal modal
   - Clear the "Assign To" selection (if possible)
   - Try to create
   - Should show error: "Please select a user to assign this deal to."

4. **Duplicate with empty fields in import:**
   - Existing lead has data in all fields
   - Import CSV with same email but some empty columns
   - Empty fields should NOT overwrite existing data
   - Only non-empty fields should update

---

## Dependencies Added

```json
{
  "libphonenumber-js": "^1.10.x"
}
```

This library provides:
- Comprehensive phone number parsing for 200+ countries
- E.164 formatting
- Validation
- Number type detection
- ~60KB gzipped (minimal overhead)

---

## Known Issues & Future Enhancements

### Known Issues
None currently - both features are production-ready!

### Future Enhancements

1. **Phone Normalization:**
   - Add phone formatting to lead import (CSV)
   - Validate phone numbers on lead/customer creation
   - Display formatted phone numbers in UI (0333 339 9808 instead of +443333399808)
   - Add phone number validation to forms

2. **SDR Assignment:**
   - Add "Reassign Deal" feature (change assignment after creation)
   - Add bulk deal assignment (assign multiple deals at once)
   - Add assignment notifications (notify SDR when deal assigned to them)
   - Filter users by role (only show SDRs in dropdown, not admins)

---

## Rollback Instructions

If issues occur:

### Rollback Phone Normalization

```bash
# Remove libphonenumber-js
npm uninstall libphonenumber-js

# Revert CallContext changes
git checkout HEAD~1 -- contexts/CallContext.tsx

# Remove phone utility file
rm lib/utils/phone.ts
```

### Rollback SDR Assignment

```bash
# Revert deal modal changes
git checkout HEAD~1 -- components/deals/deal-create-modal.tsx
```

### Full Rollback

```bash
git revert HEAD
git push origin main
```

---

## Success Criteria

✅ **Phone Normalization Working:**
- UK 0333 numbers connect successfully
- UK 0800 numbers connect successfully
- UK mobile (07xxx) numbers work
- International numbers work
- Invalid numbers show error (don't attempt call)

✅ **SDR Assignment Working:**
- Can see all users in dropdown
- Defaults to current user
- Can select different user
- Deal is assigned to selected user
- Assigned user sees deal in their pipeline

✅ **Duplicate Lead Updates Working:**
- Duplicate detection by email works
- ALL non-empty fields are updated (not just category)
- Empty fields don't overwrite existing data
- Console logs show which fields were updated
- Import summary reports update details
- CSV column name variations recognized correctly

---

## Support

If you encounter issues:

1. **Check browser console** (F12) for error messages
2. **Look for normalization logs:** `[CallContext] Normalized phone: ...`
3. **Verify Migration 040 was run** (fixes deal creation errors)
4. **Check Supabase RLS policies** (if users don't appear in dropdown)

**Common Issues:**

- **"Invalid phone number format" error:** Phone number format is invalid, check the number
- **Dropdown empty:** Users may not be loading - check Supabase connection
- **Deal creation fails:** Run Migration 040 to fix trigger issue

---

Last Updated: 2025-11-04

## Changelog

### 2025-11-04
- ✅ Added Feature 3: Smart Duplicate Lead Updates
- Now updates ALL non-empty fields when importing duplicate leads
- Enhanced import logging and reporting

### 2025-11-03
- ✅ Added Feature 1: UK Phone Number Normalization (E.164)
- ✅ Added Feature 2: SDR Assignment in Deal Creation
- Initial documentation created
