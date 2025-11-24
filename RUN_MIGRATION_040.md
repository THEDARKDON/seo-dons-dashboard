# Run Migration 040 - Fix Deal Creation Trigger

**CRITICAL:** This migration fixes a bug that causes ALL deal creations to fail with errors:
- `record "new" has no field "contact_name"` (error code 42703)
- `record "new" has no field "lead_id"` (error code 42703)

## The Problem

The `auto_create_customer_from_deal` trigger (from Migration 030) tries to access fields that don't exist in the `deals` table:
- `NEW.contact_name`
- `NEW.contact_email`
- `NEW.contact_phone`
- `NEW.lead_id`

These fields were never added to the `deals` table, causing the trigger to fail on every INSERT.

## The Fix

This migration **completely removes** the problematic trigger and function because:
1. Deals created from customer page already have `customer_id` (no auto-creation needed)
2. Deals created from deals page can optionally link to existing customer
3. Lead-to-customer conversion should happen explicitly via "Convert Lead" action (not automatically)

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

After running, verify the trigger is gone:

```sql
-- Should return 0 rows (trigger removed)
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trigger_auto_create_customer_from_deal';
```

Test deal creation:

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
1. ✅ You can create deals from the customer page without errors
2. ✅ You can create deals from the deals page without errors
3. ✅ Deals can optionally link to customers via customer_id
4. ❌ Deals will NO LONGER auto-create customers (this was broken anyway)

## Testing

1. Go to a customer page
2. Click "Create Deal"
3. Fill in deal details
4. Click "Create Deal"
5. Should succeed with no errors

**Before migration:** Error: `record "new" has no field "contact_name"`
**After migration:** ✅ Deal created successfully
