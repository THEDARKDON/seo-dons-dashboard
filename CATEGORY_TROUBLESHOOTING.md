# Category Not Showing - Troubleshooting Guide

## What We've Done

### 1. ✅ Added "SEO - Instantly Opened" Category to All Files
- **CSV Import Wizard** ([components/leads/csv-import-wizard.tsx:46](components/leads/csv-import-wizard.tsx#L46))
- **Admin Import Form** ([components/admin/lead-import-form.tsx:55](components/admin/lead-import-form.tsx#L55))
- **Categories Page** ([app/dashboard/leads/categories/page.tsx:42](app/dashboard/leads/categories/page.tsx#L42))
- **Leads List Display** ([components/leads/leads-list.tsx:85](components/leads/leads-list.tsx#L85))

### 2. ✅ Fixed Lead Sorting
Changed API from `created_at` to `updated_at` so recently updated leads appear first ([app/api/leads/route.ts:36](app/api/leads/route.ts#L36))

### 3. ✅ Added Router Refresh
Added `router.refresh()` to force data reload after import ([components/leads/csv-import-wizard.tsx:446-447](components/leads/csv-import-wizard.tsx#L446-L447))

## Where Category Should Be Visible

### In CSV Import (Step 2 - Column Mapping):
**Location**: [components/leads/csv-import-wizard.tsx:300-317](components/leads/csv-import-wizard.tsx#L300-L317)

You should see a dropdown labeled **"Lead Category (Optional)"** with these options:
- Cold Lead
- Warm Lead
- Hot Lead
- Instantly Opened
- **SEO - Instantly Opened** ← NEW
- Email Replied
- Meeting Scheduled
- Follow Up
- Not Interested

### In Leads List:
**Location**: [components/leads/leads-list.tsx:533-548](components/leads/leads-list.tsx#L533-L548)

Each lead should show a category badge next to the status badge:
- If lead has category: Shows colored badge (e.g., "SEO - Instantly Opened" in indigo)
- If no category: Shows gray "Set Category" badge
- Click badge to edit category

## Troubleshooting Steps

### Step 1: Verify Database Has Categories
Run this query in your Supabase SQL editor:

```sql
-- Check if categories exist in database
SELECT
    category,
    COUNT(*) as count,
    MAX(updated_at) as last_updated
FROM leads
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;
```

**Expected Result**: Should show rows with `seo_instantly_opened` if you imported with that category

### Step 2: Verify Recent Imports Updated
```sql
-- Check recently updated leads
SELECT
    id,
    first_name,
    last_name,
    email,
    category,
    created_at,
    updated_at,
    (updated_at > created_at) as was_updated
FROM leads
ORDER BY updated_at DESC
LIMIT 20;
```

**Expected Result**:
- Recent imports should have `was_updated = true`
- Should show the category value (e.g., `seo_instantly_opened`)

### Step 3: Check Frontend Console
Open browser DevTools (F12) and:

1. **Go to Console tab** - Look for any errors
2. **Go to Network tab** - Filter by "leads"
3. **Refresh the leads page**
4. **Click on the `/api/leads` request**
5. **Check the Response** - Should show leads with `category` field

Example response:
```json
{
  "leads": [
    {
      "id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "category": "seo_instantly_opened",  ← Should be here
      ...
    }
  ]
}
```

### Step 4: Hard Refresh Browser
- **Windows**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

This clears the browser cache and forces a fresh load.

### Step 5: Check Import Process
When importing leads:

1. Go to **Leads** → **Import CSV**
2. Upload CSV file
3. On **Step 2** (Map Columns):
   - Look for blue box at the top: **"Lead Category (Optional)"**
   - Open the dropdown
   - **Verify "SEO - Instantly Opened" is in the list**
4. Select category
5. Complete import
6. Click **"View All Leads"**

## Common Issues

### Issue 1: Deployment Not Updated
**Symptom**: Changes not visible in production
**Solution**:
- Check Vercel deployment status
- Commits pushed:
  - `dca3aaa` - Added category and fixed sorting
  - `d93a810` - Added category to leads list
  - `1cf4ab4` - Added router refresh

### Issue 2: Browser Cache
**Symptom**: Old version showing
**Solution**: Hard refresh (Ctrl+Shift+R)

### Issue 3: Database Not Updated
**Symptom**: Categories not in database
**Solution**:
- Check if import actually ran
- Check console logs during import
- Verify import API is working

### Issue 4: Wrong API Route
**Symptom**: Using old import endpoint
**Solution**:
- CSV wizard uses `/api/leads/import`
- Verify this file exists: `app/api/leads/import/route.ts`
- Check it's actually at: `app/api/admin/leads/import/route.ts`

## Files to Check

1. **Category Definitions** (4 files):
   - `components/leads/csv-import-wizard.tsx` (line 41-51)
   - `components/admin/lead-import-form.tsx` (line 50-59)
   - `app/dashboard/leads/categories/page.tsx` (line 37-47)
   - `components/leads/leads-list.tsx` (line 80-90)

2. **Import API**:
   - `app/api/admin/leads/import/route.ts` (line 118 - category mapping)

3. **Leads API**:
   - `app/api/leads/route.ts` (line 36 - sorting by updated_at)

## Database Schema Check

Run this to verify the category column exists:
```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name = 'category';
```

**Expected Result**:
```
column_name | data_type | is_nullable | column_default
category    | text      | YES         | NULL
```

## Still Not Working?

If categories are still not showing after all checks:

1. **Take a screenshot** of:
   - The leads list page
   - The CSV import step 2 (category dropdown)
   - Browser console (F12 → Console tab)
   - Network tab showing `/api/leads` response

2. **Check these specific things**:
   - Is the dropdown visible in Step 2 of import?
   - Can you see "SEO - Instantly Opened" in that dropdown?
   - After import, do you see any category badges on leads?
   - What does the API response show for category field?

3. **Run the diagnostic SQL**:
   ```sql
   -- See file: CHECK_CATEGORIES_IN_DB.sql
   ```

## Expected Behavior After Fix

1. **Import Page**: Dropdown shows all 9 categories including "SEO - Instantly Opened"
2. **After Import**: 300 updated leads appear at TOP of list (sorted by updated_at)
3. **Leads List**: Each lead shows colored category badge
4. **Click Badge**: Dropdown opens to change category
5. **Database**: Category field populated with `seo_instantly_opened`
