# Run Migration 040 - Fix Deal Creation Trigger

**CRITICAL:** This migration fixes a bug that causes ALL deal creations to fail with error: `record "new" has no field "contact_name"`

## The Problem

The `auto_create_customer_from_deal` trigger (from Migration 030) tries to access fields that don't exist:
- `NEW.contact_name`
- `NEW.contact_email`
- `NEW.contact_phone`

These fields were never added to the `deals` table, causing the trigger to fail on every INSERT.

## The Fix

This migration:
1. Drops the broken trigger and function
2. Creates a simpler version that only uses existing fields
3. Only auto-creates customers from leads (when `lead_id` is provided)
4. Does NOT try to access non-existent `contact_*` fields

## How to Run

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste the SQL from `supabase/migrations/040_fix_deal_creation_trigger.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)

### Option 2: Via Supabase CLI

```bash
npx supabase db push
```

## Verify the Migration

After running, test deal creation:

```sql
-- This should now succeed (previously failed)
INSERT INTO deals (
    assigned_to,
    deal_name,
    deal_value,
    stage
)
SELECT
    id,
    'Test Deal',
    5000,
    'prospecting'
FROM users
LIMIT 1;
```

## After Running Migration

Once the migration is complete:
1. You can create deals from the customer page without errors
2. You can create deals from the deals page without errors
3. Deals with `lead_id` will still auto-create customers
4. Deals without `lead_id` will work fine (no customer auto-creation)

## Testing

1. Go to a customer page
2. Click "Create Deal"
3. Fill in deal details
4. Click "Create Deal"
5. Should succeed with no errors

**Before migration:** Error: `record "new" has no field "contact_name"`
**After migration:** ✅ Deal created successfully
