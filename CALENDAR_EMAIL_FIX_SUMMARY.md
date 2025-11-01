# Calendar & Email Integration Fix - Summary

## Issues Identified

### 1. Calendar Integration - `contact_email` Column Missing
**Error:**
```
Could not find the 'contact_email' column of 'activities' in the schema cache
```

**Cause:**
- Migration `024_add_contact_fields_to_activities.sql` exists but was never applied to production database
- Code expects `contact_name` and `contact_email` columns in activities table
- These columns allow storing contact information even without a customer_id

**Affected Features:**
- Creating appointments from calls
- Manual appointment creation
- Google Calendar integration
- Email notifications for appointments

### 2. Email System Integration
**Issue:**
- Settings page shows "Unable to link E-mails in the settings tab"
- Email field exists in settings form but may not be saving correctly

## Root Cause

The production database is missing schema changes from migration `024`. This happened because:
1. Migration file exists locally but wasn't run on production
2. Unified database changes affected the schema
3. Activities table structure is out of sync

## Solution

### Step 1: Run SQL to Add Missing Columns

Go to Supabase SQL Editor:
**URL:** https://supabase.com/dashboard/project/hfkfucslnalrltsnsvws/sql/new

Run the SQL from `FIX_CALENDAR_AND_EMAIL.sql`:

```sql
-- Add missing columns
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_contact_email ON activities(contact_email);
CREATE INDEX IF NOT EXISTS idx_activities_contact_name ON activities(contact_name);

-- Add comments
COMMENT ON COLUMN activities.contact_name IS 'Contact name when customer_id is not available';
COMMENT ON COLUMN activities.contact_email IS 'Contact email when customer_id is not available';
```

### Step 2: Verify Fix

After running the SQL, verify with:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'activities'
  AND column_name IN ('contact_name', 'contact_email');
```

**Expected Result:**
```
column_name    | data_type | is_nullable
contact_name   | text      | YES
contact_email  | text      | YES
```

## Testing Instructions

### Test 1: Manual Appointment Creation

1. Go to `/dashboard/appointments/new`
2. Fill in appointment details:
   - Contact Name: "Test Contact"
   - Contact Email: "test@example.com"
   - Date/Time: Tomorrow at 2pm
   - Subject: "Test Appointment"
3. Click "Create Appointment"

**Expected:**
- ✅ Appointment created successfully
- ✅ No "contact_email column not found" error
- ✅ Appointment appears in appointments list

### Test 2: Calendar Integration

1. Go to `/dashboard/settings`
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Create a new appointment (as in Test 1)

**Expected:**
- ✅ Appointment created in CRM
- ✅ Event created in Google Calendar
- ✅ Calendar invite sent to contact email

### Test 3: Appointment from Call

1. Make a test call (or use existing call)
2. Click "Book Appointment" during/after call
3. Enter contact email and meeting details
4. Submit

**Expected:**
- ✅ Activity created with contact_email
- ✅ Calendar event created (if calendar connected)
- ✅ No database errors

### Test 4: Email Settings

1. Go to `/dashboard/settings`
2. Update email field
3. Click "Save Changes"

**Expected:**
- ✅ Email saves successfully
- ✅ No errors in console
- ✅ Page refreshes with updated email

## Files Affected

### Database Migration
- [supabase/migrations/024_add_contact_fields_to_activities.sql](supabase/migrations/024_add_contact_fields_to_activities.sql) - Existing migration (not applied)

### Code Using These Columns

1. **[app/api/calendar/create-event/route.ts](app/api/calendar/create-event/route.ts)**
   - Lines 73-74: Inserts `contact_name` and `contact_email`
   ```typescript
   contact_name: customerName || null,
   contact_email: customerEmail || null,
   ```

2. **[app/dashboard/appointments/new/page.tsx](app/dashboard/appointments/new/page.tsx)**
   - Uses contact_email for manual appointment creation

3. **[app/dashboard/appointments/page.tsx](app/dashboard/appointments/page.tsx)**
   - Displays appointments with contact information

### Settings Components
- [app/dashboard/settings/page.tsx](app/dashboard/settings/page.tsx) - Main settings page
- [components/settings/settings-form.tsx](components/settings/settings-form.tsx) - Form with email field

## Additional Notes

### Why These Columns Are Needed

The `contact_name` and `contact_email` columns serve an important purpose:

**Before Fix:**
- Activities required a `customer_id` (foreign key to customers table)
- Couldn't create appointments for leads that aren't customers yet
- Manual appointments needed customer record first

**After Fix:**
- Can store contact info directly in activity
- Works with leads, customers, or standalone contacts
- More flexible appointment creation
- Calendar integration works without customer records

### Data Model
```
activities table:
├── customer_id (optional) - Link to customer record
├── lead_id (optional) - Link to lead record
├── contact_name (new) - Contact name when no customer_id
└── contact_email (new) - Contact email when no customer_id
```

## Migration History

This issue was created because:
1. **Local development** had migration file
2. **Production database** didn't receive the migration
3. **Code deployment** happened with new code expecting columns
4. **Result:** Runtime errors when columns not found

## Prevention

To prevent this in future:

1. **Always run migrations before deploying code**
   ```bash
   # Check pending migrations
   npx supabase db diff

   # Apply migrations
   npx supabase db push
   ```

2. **Verify schema matches code**
   - Check column existence before using
   - Use `.maybeSingle()` for optional relationships
   - Add proper error handling

3. **Document schema changes**
   - Update migration files
   - Add comments to columns
   - Keep TESTING_GUIDE.md updated

## Rollback Plan

If issues occur after applying fix:

```sql
-- Remove columns (NOT RECOMMENDED - will lose data)
ALTER TABLE activities
DROP COLUMN IF EXISTS contact_name,
DROP COLUMN IF EXISTS contact_email;

-- Drop indexes
DROP INDEX IF EXISTS idx_activities_contact_email;
DROP INDEX IF EXISTS idx_activities_contact_name;
```

**Note:** Only rollback if critical issues occur. These columns are needed for appointment features to work.

---

## Quick Fix Checklist

- [ ] Run SQL from FIX_CALENDAR_AND_EMAIL.sql in Supabase
- [ ] Verify columns created with verification query
- [ ] Test manual appointment creation
- [ ] Test calendar integration
- [ ] Test email settings update
- [ ] Confirm no errors in browser console
- [ ] Confirm no errors in Supabase logs

---

**Status:** 🔧 Ready to apply
**Priority:** HIGH - Blocking appointment and calendar features
**Impact:** Calendar integration, appointment booking, email settings

**Apply Fix:** Run FIX_CALENDAR_AND_EMAIL.sql in Supabase SQL Editor
